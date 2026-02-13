import json
import logging
import os
import re
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


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
