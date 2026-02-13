import json
import logging
import os
import re
import shutil
import subprocess
import uuid

from flask import Flask, jsonify, request
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

SESSIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "sessions")
DEFAULT_DATA = {"grid": {"cells": {}, "rowCount": 100, "colCount": 26}, "snapshots": []}
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

# ── Agent (Claude Code CLI) ───────────────────────────────────────
AGENT_GUIDE = ""

_guide_path = os.path.join(os.path.dirname(__file__), "..", "AGENT_GUIDE.md")
if os.path.exists(_guide_path):
    with open(_guide_path, "r", encoding="utf-8") as f:
        AGENT_GUIDE = f.read()

CLAUDE_CMD = None
_claude_path = shutil.which("claude")
if _claude_path:
    CLAUDE_CMD = [_claude_path]
    logger.info("Claude CLI found at %s", _claude_path)
else:
    _npx_path = shutil.which("npx")
    if _npx_path:
        CLAUDE_CMD = [_npx_path, "--yes", "@anthropic-ai/claude-code"]
        logger.info("Claude CLI available via npx")
    else:
        logger.warning("Neither claude nor npx found — agent endpoint will be unavailable")


def _validate_session_id(session_id):
    """Validate that a session ID is a proper UUID format."""
    return bool(session_id and UUID_RE.match(session_id))


def _get_session_dir(session_id):
    return os.path.join(SESSIONS_DIR, session_id)


def _get_data_file(session_id):
    return os.path.join(SESSIONS_DIR, session_id, "spreadsheet.json")


def _require_session():
    """Extract and validate session ID from request header. Returns (session_id, error_response)."""
    session_id = request.headers.get("X-Session-Id")
    if not session_id:
        return None, (jsonify({"error": "Missing X-Session-Id header"}), 401)
    if not _validate_session_id(session_id):
        return None, (jsonify({"error": "Invalid session ID format"}), 400)
    if not os.path.exists(_get_session_dir(session_id)):
        return None, (jsonify({"error": "Session not found"}), 401)
    return session_id, None


def _read_data(session_id):
    """Read the JSON data file for a session."""
    data_file = _get_data_file(session_id)
    if not os.path.exists(data_file):
        return dict(DEFAULT_DATA)
    with open(data_file, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_data(session_id, data):
    """Write the full data object to the session JSON file."""
    data_file = _get_data_file(session_id)
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ── Session endpoints ──────────────────────────────────────────────

@app.route("/api/session", methods=["POST"])
def create_session():
    """Create a new session with a unique UUID and default data."""
    session_id = str(uuid.uuid4())
    session_dir = _get_session_dir(session_id)
    os.makedirs(session_dir, exist_ok=True)

    data_file = _get_data_file(session_id)
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_DATA, f, ensure_ascii=False, indent=2)

    logger.info("Created session %s", session_id)
    return jsonify({"sessionId": session_id})


@app.route("/api/session/<session_id>", methods=["GET"])
def check_session(session_id):
    """Check if a session exists."""
    if not _validate_session_id(session_id):
        return jsonify({"error": "Invalid session ID format"}), 400
    if not os.path.exists(_get_session_dir(session_id)):
        return jsonify({"error": "Session not found"}), 404
    return jsonify({"status": "ok"})


# ── Data endpoints (scoped by session) ─────────────────────────────

@app.route("/api/health")
def health():
    return {"status": "ok"}


@app.route("/api/data", methods=["GET"])
def get_data():
    """Return the full spreadsheet data for the current session."""
    session_id, error = _require_session()
    if error:
        return error

    data = _read_data(session_id)
    return jsonify(data)


@app.route("/api/data", methods=["POST"])
def save_data():
    """Save grid data and optionally a new snapshot for the current session."""
    session_id, error = _require_session()
    if error:
        return error

    body = request.get_json()
    if not body:
        return jsonify({"error": "Empty request body"}), 400

    current = _read_data(session_id)

    if "grid" in body:
        current["grid"] = body["grid"]

    if "snapshots" in body:
        current["snapshots"] = body["snapshots"]

    if "snapshot" in body:
        current["snapshots"].append(body["snapshot"])

    _write_data(session_id, current)
    return jsonify({"status": "ok"})


@app.route("/api/data/snapshot/<snapshot_id>", methods=["DELETE"])
def delete_snapshot(snapshot_id):
    """Delete a snapshot by ID for the current session."""
    session_id, error = _require_session()
    if error:
        return error

    current = _read_data(session_id)
    before = len(current.get("snapshots", []))
    current["snapshots"] = [s for s in current.get("snapshots", []) if s.get("id") != snapshot_id]

    if len(current["snapshots"]) == before:
        return jsonify({"error": "Snapshot not found"}), 404

    _write_data(session_id, current)
    return jsonify({"status": "ok"})


@app.route("/api/data/lastmod", methods=["GET"])
def get_lastmod():
    """Return the last modification timestamp of the session data file."""
    session_id, error = _require_session()
    if error:
        return error

    data_file = _get_data_file(session_id)
    if not os.path.exists(data_file):
        return jsonify({"lastmod": 0})
    mtime = os.path.getmtime(data_file)
    return jsonify({"lastmod": mtime})


# ── Agent chat endpoint (Claude Code CLI) ─────────────────────────

@app.route("/api/agent/chat", methods=["POST"])
def agent_chat():
    """Send a user message to Claude Code CLI which reads/edits the spreadsheet directly."""
    if not CLAUDE_CMD:
        return jsonify({"error": "Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code"}), 503

    session_id, error = _require_session()
    if error:
        return error

    body = request.get_json()
    if not body or not body.get("message"):
        return jsonify({"error": "Missing 'message' field"}), 400

    user_message = body["message"]
    data_file = os.path.abspath(_get_data_file(session_id))

    # Build the full prompt: system context + user request
    # The system context (AGENT_GUIDE + file path) is invisible to the user
    full_prompt = (
        f"{AGENT_GUIDE}\n\n"
        "---\n\n"
        f"Le fichier spreadsheet a modifier est : {data_file}\n\n"
        "Lis ce fichier avec l'outil Read, comprends sa structure (cellules, zones, headers), "
        "puis applique les modifications demandees par l'utilisateur en editant le fichier avec l'outil Edit.\n"
        "Reponds toujours en francais.\n"
        "Explique brievement ce que tu as fait.\n"
        "Ne modifie que les cellules necessaires, ne touche pas aux snapshots ni aux autres champs.\n\n"
        "---\n\n"
        f"Demande de l'utilisateur : {user_message}"
    )

    try:
        logger.info("Calling Claude CLI for session %s: %s", session_id, user_message[:100])

        # Clean env: remove CLAUDECODE (nested session block) and ANTHROPIC_API_KEY
        # (forces CLI to use the user's Max/Pro subscription auth instead of API credits)
        env = {k: v for k, v in os.environ.items() if k not in ("CLAUDECODE", "ANTHROPIC_API_KEY")}

        result = subprocess.run(
            [
                *CLAUDE_CMD,
                "-p", full_prompt,
                "--allowedTools", "Read,Edit,Write",
                "--max-turns", "10",
            ],
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )

        if result.returncode != 0:
            error_msg = result.stderr.strip() or result.stdout.strip() or "Claude CLI returned an error"
            logger.error("Claude CLI error: %s", error_msg)
            return jsonify({"error": error_msg}), 500

        reply = result.stdout.strip()
        logger.info("Claude CLI response for session %s: %s", session_id, reply[:200])

        return jsonify({
            "reply": reply,
            "modified": True,
        })

    except subprocess.TimeoutExpired:
        logger.error("Claude CLI timeout for session %s", session_id)
        return jsonify({"error": "L'agent a mis trop de temps a repondre (timeout 2min)"}), 504

    except Exception as e:
        logger.exception("Agent chat error")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
