import json
import logging
import os
import re
import shutil
import subprocess
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_db, init_db, DATA_DIR

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

JWT_SECRET = os.environ.get("JWT_SECRET", "cellium-dev-secret-change-in-prod")
JWT_EXPIRATION_HOURS = 72

SESSIONS_DIR = os.path.join(DATA_DIR, "sessions")
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


# ── JWT Helpers ────────────────────────────────────────────────────

def _create_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def require_auth(f):
    """Decorator: extract and validate JWT from Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token manquant"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expiré"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalide"}), 401
        request.user_id = payload["user_id"]
        request.user_email = payload["email"]
        return f(*args, **kwargs)
    return decorated


# ── Session / file helpers ─────────────────────────────────────────

def _validate_session_id(session_id):
    return bool(session_id and UUID_RE.match(session_id))


def _get_session_dir(session_id):
    return os.path.join(SESSIONS_DIR, session_id)


def _get_data_file(session_id):
    return os.path.join(SESSIONS_DIR, session_id, "spreadsheet.json")


def _read_data(session_id):
    data_file = _get_data_file(session_id)
    if not os.path.exists(data_file):
        return dict(DEFAULT_DATA)
    with open(data_file, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_data(session_id, data):
    data_file = _get_data_file(session_id)
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _require_spreadsheet():
    """Extract spreadsheet ID from header, verify ownership."""
    spreadsheet_id = request.headers.get("X-Session-Id")
    if not spreadsheet_id:
        return None, (jsonify({"error": "Missing X-Session-Id header"}), 401)
    if not _validate_session_id(spreadsheet_id):
        return None, (jsonify({"error": "Invalid spreadsheet ID format"}), 400)
    if not os.path.exists(_get_session_dir(spreadsheet_id)):
        return None, (jsonify({"error": "Spreadsheet not found"}), 404)

    # Verify ownership
    db = get_db()
    row = db.execute(
        "SELECT user_id FROM spreadsheets WHERE id = ?", (spreadsheet_id,)
    ).fetchone()
    db.close()

    if not row:
        return None, (jsonify({"error": "Spreadsheet not found"}), 404)
    if row["user_id"] != request.user_id:
        return None, (jsonify({"error": "Accès non autorisé"}), 403)

    return spreadsheet_id, None


# ── Auth endpoints ─────────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    body = request.get_json()
    if not body:
        return jsonify({"error": "Corps de requête vide"}), 400

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    name = (body.get("name") or "").strip()

    if not email or not password or not name:
        return jsonify({"error": "Email, mot de passe et nom requis"}), 400
    if len(password) < 6:
        return jsonify({"error": "Le mot de passe doit contenir au moins 6 caractères"}), 400

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
            (email, password_hash, name),
        )
        db.commit()
        user_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    except Exception:
        db.close()
        return jsonify({"error": "Cet email est déjà utilisé"}), 409
    db.close()

    token = _create_token(user_id, email)
    logger.info("User registered: %s (id=%d)", email, user_id)
    return jsonify({"token": token, "user": {"id": user_id, "email": email, "name": name}})


@app.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json()
    if not body:
        return jsonify({"error": "Corps de requête vide"}), 400

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email et mot de passe requis"}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    db.close()

    if not user:
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401

    token = _create_token(user["id"], user["email"])
    logger.info("User logged in: %s", email)
    return jsonify({
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
    })


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def get_me():
    db = get_db()
    user = db.execute("SELECT id, email, name FROM users WHERE id = ?", (request.user_id,)).fetchone()
    db.close()
    if not user:
        return jsonify({"error": "Utilisateur introuvable"}), 404
    return jsonify({"user": {"id": user["id"], "email": user["email"], "name": user["name"]}})


# ── Spreadsheet management (dashboard) ────────────────────────────

@app.route("/api/spreadsheets", methods=["GET"])
@require_auth
def list_spreadsheets():
    db = get_db()
    rows = db.execute(
        "SELECT id, name, created_at, updated_at FROM spreadsheets WHERE user_id = ? ORDER BY updated_at DESC",
        (request.user_id,),
    ).fetchall()
    db.close()
    return jsonify([
        {"id": r["id"], "name": r["name"], "createdAt": r["created_at"], "updatedAt": r["updated_at"]}
        for r in rows
    ])


@app.route("/api/spreadsheets", methods=["POST"])
@require_auth
def create_spreadsheet():
    body = request.get_json() or {}
    name = (body.get("name") or "Sans titre").strip()

    spreadsheet_id = str(uuid.uuid4())
    session_dir = _get_session_dir(spreadsheet_id)
    os.makedirs(session_dir, exist_ok=True)

    data_file = _get_data_file(spreadsheet_id)
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_DATA, f, ensure_ascii=False, indent=2)

    db = get_db()
    db.execute(
        "INSERT INTO spreadsheets (id, user_id, name) VALUES (?, ?, ?)",
        (spreadsheet_id, request.user_id, name),
    )
    db.commit()
    db.close()

    logger.info("Spreadsheet created: %s for user %d", spreadsheet_id, request.user_id)
    return jsonify({"id": spreadsheet_id, "name": name})


@app.route("/api/spreadsheets/<spreadsheet_id>", methods=["PATCH"])
@require_auth
def rename_spreadsheet(spreadsheet_id):
    body = request.get_json()
    if not body or not body.get("name"):
        return jsonify({"error": "Nom requis"}), 400

    name = body["name"].strip()
    db = get_db()
    row = db.execute("SELECT user_id FROM spreadsheets WHERE id = ?", (spreadsheet_id,)).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Spreadsheet introuvable"}), 404
    if row["user_id"] != request.user_id:
        db.close()
        return jsonify({"error": "Accès non autorisé"}), 403

    db.execute(
        "UPDATE spreadsheets SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (name, spreadsheet_id),
    )
    db.commit()
    db.close()
    return jsonify({"status": "ok"})


@app.route("/api/spreadsheets/<spreadsheet_id>", methods=["DELETE"])
@require_auth
def delete_spreadsheet(spreadsheet_id):
    db = get_db()
    row = db.execute("SELECT user_id FROM spreadsheets WHERE id = ?", (spreadsheet_id,)).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Spreadsheet introuvable"}), 404
    if row["user_id"] != request.user_id:
        db.close()
        return jsonify({"error": "Accès non autorisé"}), 403

    db.execute("DELETE FROM spreadsheets WHERE id = ?", (spreadsheet_id,))
    db.commit()
    db.close()

    # Remove session directory
    session_dir = _get_session_dir(spreadsheet_id)
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir)

    return jsonify({"status": "ok"})


# ── Health ─────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return {"status": "ok"}


# ── Data endpoints (scoped by spreadsheet + auth) ──────────────────

@app.route("/api/data", methods=["GET"])
@require_auth
def get_data():
    spreadsheet_id, error = _require_spreadsheet()
    if error:
        return error
    data = _read_data(spreadsheet_id)
    return jsonify(data)


@app.route("/api/data", methods=["POST"])
@require_auth
def save_data():
    spreadsheet_id, error = _require_spreadsheet()
    if error:
        return error

    body = request.get_json()
    if not body:
        return jsonify({"error": "Empty request body"}), 400

    current = _read_data(spreadsheet_id)

    if "grid" in body:
        current["grid"] = body["grid"]
    if "snapshots" in body:
        current["snapshots"] = body["snapshots"]
    if "snapshot" in body:
        current["snapshots"].append(body["snapshot"])

    _write_data(spreadsheet_id, current)

    # Update the updated_at timestamp
    db = get_db()
    db.execute("UPDATE spreadsheets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (spreadsheet_id,))
    db.commit()
    db.close()

    return jsonify({"status": "ok"})


@app.route("/api/data/snapshot/<snapshot_id>", methods=["DELETE"])
@require_auth
def delete_snapshot(snapshot_id):
    spreadsheet_id, error = _require_spreadsheet()
    if error:
        return error

    current = _read_data(spreadsheet_id)
    before = len(current.get("snapshots", []))
    current["snapshots"] = [s for s in current.get("snapshots", []) if s.get("id") != snapshot_id]

    if len(current["snapshots"]) == before:
        return jsonify({"error": "Snapshot not found"}), 404

    _write_data(spreadsheet_id, current)
    return jsonify({"status": "ok"})


@app.route("/api/data/lastmod", methods=["GET"])
@require_auth
def get_lastmod():
    spreadsheet_id, error = _require_spreadsheet()
    if error:
        return error

    data_file = _get_data_file(spreadsheet_id)
    if not os.path.exists(data_file):
        return jsonify({"lastmod": 0})
    mtime = os.path.getmtime(data_file)
    return jsonify({"lastmod": mtime})


# ── Agent chat endpoint (Claude Code CLI) ─────────────────────────

@app.route("/api/agent/chat", methods=["POST"])
@require_auth
def agent_chat():
    if not CLAUDE_CMD:
        return jsonify({"error": "Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code"}), 503

    spreadsheet_id, error = _require_spreadsheet()
    if error:
        return error

    body = request.get_json()
    if not body or not body.get("message"):
        return jsonify({"error": "Missing 'message' field"}), 400

    user_message = body["message"]
    data_file = os.path.abspath(_get_data_file(spreadsheet_id))

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
        logger.info("Calling Claude CLI for spreadsheet %s: %s", spreadsheet_id, user_message[:100])

        env = {k: v for k, v in os.environ.items() if k not in ("CLAUDECODE", "ANTHROPIC_API_KEY")}

        result = subprocess.run(
            [
                *CLAUDE_CMD,
                "-p", full_prompt,
                "--allowedTools", "Bash,Read,Edit,Write,WebFetch,WebSearch",
                "--max-turns", "50",
            ],
            capture_output=True,
            text=True,
            timeout=900,
            env=env,
        )

        if result.returncode != 0:
            error_msg = result.stderr.strip() or result.stdout.strip() or "Claude CLI returned an error"
            logger.error("Claude CLI error: %s", error_msg)
            return jsonify({"error": error_msg}), 500

        reply = result.stdout.strip()
        logger.info("Claude CLI response for spreadsheet %s: %s", spreadsheet_id, reply[:200])

        return jsonify({
            "reply": reply,
            "modified": True,
        })

    except subprocess.TimeoutExpired:
        logger.error("Claude CLI timeout for spreadsheet %s", spreadsheet_id)
        return jsonify({"error": "L'agent a mis trop de temps a repondre (timeout 15min)"}), 504

    except Exception as e:
        logger.exception("Agent chat error")
        return jsonify({"error": str(e)}), 500


# ── Init & Run ─────────────────────────────────────────────────────

init_db()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
