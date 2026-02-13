import json
import logging
import os
import re
import uuid

from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS
from anthropic import Anthropic

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

# ── Agent (Anthropic API) ─────────────────────────────────────────
anthropic_client = None
AGENT_GUIDE = ""

_guide_path = os.path.join(os.path.dirname(__file__), "..", "AGENT_GUIDE.md")
if os.path.exists(_guide_path):
    with open(_guide_path, "r", encoding="utf-8") as f:
        AGENT_GUIDE = f.read()

api_key = os.environ.get("ANTHROPIC_API_KEY")
if api_key:
    anthropic_client = Anthropic(api_key=api_key)
    logger.info("Anthropic client initialized")
else:
    logger.warning("ANTHROPIC_API_KEY not set — agent endpoint will be unavailable")

UPDATE_SPREADSHEET_TOOL = {
    "name": "update_spreadsheet",
    "description": (
        "Modify the spreadsheet by adding, updating, or deleting cells. "
        "Provide a dict of cells to set (cellId -> cell object) and optionally a list of cellIds to delete."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "cells_to_set": {
                "type": "object",
                "description": "Cells to add or update. Keys are cell IDs (e.g. 'B11'). Values are objects with id, value, and optionally formula and name.",
                "additionalProperties": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "value": {},
                        "formula": {"type": "string"},
                        "name": {"type": "string"},
                    },
                    "required": ["id", "value"],
                },
            },
            "cells_to_delete": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of cell IDs to remove.",
            },
        },
        "required": ["cells_to_set"],
    },
}


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


# ── Agent chat endpoint ────────────────────────────────────────────

def _build_system_prompt(grid_data):
    """Build the system prompt with AGENT_GUIDE + current spreadsheet context."""
    grid_summary = json.dumps(grid_data, ensure_ascii=False, indent=2)
    return (
        f"{AGENT_GUIDE}\n\n"
        "---\n\n"
        "# Etat actuel du spreadsheet\n\n"
        f"```json\n{grid_summary}\n```\n\n"
        "Reponds toujours en francais. "
        "Quand l'utilisateur demande une modification, utilise l'outil update_spreadsheet pour appliquer les changements. "
        "Explique brievement ce que tu as fait apres chaque modification."
    )


@app.route("/api/agent/chat", methods=["POST"])
def agent_chat():
    """Send a user message to Claude and apply any spreadsheet modifications."""
    if not anthropic_client:
        return jsonify({"error": "ANTHROPIC_API_KEY not configured"}), 503

    session_id, error = _require_session()
    if error:
        return error

    body = request.get_json()
    if not body or not body.get("message"):
        return jsonify({"error": "Missing 'message' field"}), 400

    user_message = body["message"]
    conversation_history = body.get("history", [])

    # Read current spreadsheet data
    current_data = _read_data(session_id)
    grid_data = current_data.get("grid", {})

    system_prompt = _build_system_prompt(grid_data)

    # Build messages: history + new user message
    messages = []
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    try:
        # Call Claude with tool use
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system_prompt,
            tools=[UPDATE_SPREADSHEET_TOOL],
            messages=messages,
        )

        assistant_text = ""
        tool_used = False

        # Process response — handle tool use loop
        while response.stop_reason == "tool_use":
            # Extract text blocks and tool use blocks
            response_content = response.content
            for block in response_content:
                if block.type == "text":
                    assistant_text += block.text
                elif block.type == "tool_use" and block.name == "update_spreadsheet":
                    tool_used = True
                    tool_input = block.input

                    # Apply changes to spreadsheet
                    cells_to_set = tool_input.get("cells_to_set", {})
                    cells_to_delete = tool_input.get("cells_to_delete", [])

                    for cell_id, cell_data in cells_to_set.items():
                        current_data["grid"]["cells"][cell_id] = cell_data

                    for cell_id in cells_to_delete:
                        current_data["grid"]["cells"].pop(cell_id, None)

                    _write_data(session_id, current_data)

                    # Continue conversation with tool result
                    messages.append({"role": "assistant", "content": response_content})
                    messages.append({
                        "role": "user",
                        "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": json.dumps({
                                    "status": "ok",
                                    "cells_updated": list(cells_to_set.keys()),
                                    "cells_deleted": cells_to_delete,
                                }),
                            }
                        ],
                    })

                    # Call again for Claude to provide a summary
                    response = anthropic_client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=4096,
                        system=system_prompt,
                        tools=[UPDATE_SPREADSHEET_TOOL],
                        messages=messages,
                    )

        # Extract final text from the response
        for block in response.content:
            if block.type == "text":
                assistant_text += block.text

        return jsonify({
            "reply": assistant_text,
            "modified": tool_used,
        })

    except Exception as e:
        logger.exception("Agent chat error")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
