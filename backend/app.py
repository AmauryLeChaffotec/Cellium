import json
import logging
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "spreadsheet.json")

DEFAULT_DATA = {"grid": {"cells": {}, "rowCount": 100, "colCount": 26}, "snapshots": []}


def _read_data():
    """Read the JSON data file, creating it with defaults if missing."""
    if not os.path.exists(DATA_FILE):
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_DATA, f, ensure_ascii=False, indent=2)
        return DEFAULT_DATA
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_data(data):
    """Write the full data object to the JSON file."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route("/api/health")
def health():
    return {"status": "ok"}


@app.route("/api/data", methods=["GET"])
def get_data():
    """Return the full spreadsheet data (grid + snapshots)."""
    data = _read_data()
    return jsonify(data)


@app.route("/api/data", methods=["POST"])
def save_data():
    """Save grid data and optionally a new snapshot."""
    body = request.get_json()
    if not body:
        return jsonify({"error": "Empty request body"}), 400

    current = _read_data()

    # Update grid if provided
    if "grid" in body:
        current["grid"] = body["grid"]

    # Append snapshot if provided
    if "snapshot" in body:
        current["snapshots"].append(body["snapshot"])

    _write_data(current)
    return jsonify({"status": "ok"})


@app.route("/api/data/lastmod", methods=["GET"])
def get_lastmod():
    """Return the last modification timestamp of the data file."""
    if not os.path.exists(DATA_FILE):
        return jsonify({"lastmod": 0})
    mtime = os.path.getmtime(DATA_FILE)
    return jsonify({"lastmod": mtime})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
