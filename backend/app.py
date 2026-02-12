import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from llm_service import call_llm
from validators import validate_command_request

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Verify API key exists at startup
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env")

app = Flask(__name__)
CORS(app)


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def convert_keys_to_camel(data):
    """Recursively convert dict keys from snake_case to camelCase."""
    if isinstance(data, dict):
        return {to_camel_case(k): convert_keys_to_camel(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_keys_to_camel(item) for item in data]
    else:
        return data


@app.route("/api/health")
def health():
    return {"status": "ok"}


@app.route("/api/ai/command", methods=["POST"])
def ai_command():
    """Handle AI command requests with NLP and grid context.

    Request JSON:
        {
            "command": "natural language command",
            "gridContext": {
                "headers": ["A", "B", ...],
                "columnTypes": {...},
                "rowCount": 10,
                "sampleRows": [...]
            }
        }

    Response JSON (camelCase):
        Success: { "operations": [...], "description": "..." }
        Clarification: { "operations": [], "clarification": "..." }
        Error: { "error": "...", "code": "ERROR_CODE" }
    """
    data = request.get_json()

    # Validation
    is_valid, error = validate_command_request(data)
    if not is_valid:
        logger.warning(f"Invalid request: {error}")
        return jsonify({"error": f"Invalid request: {error}", "code": error}), 400

    command = data["command"]
    grid_context = data["gridContext"]

    logger.info(f"Received command: {command[:50]}...")

    try:
        # Call LLM
        result = call_llm(command, grid_context)

        # Convert to camelCase
        result_camel = convert_keys_to_camel(result)

        # Log success
        if "operations" in result and len(result["operations"]) > 0:
            logger.info(f"LLM returned {len(result['operations'])} operations")
        elif "clarification" in result:
            logger.info("LLM requested clarification")

        return jsonify(result_camel), 200

    except Exception as e:
        error_msg = str(e)

        if "LLM_TIMEOUT" in error_msg:
            logger.error("LLM timeout")
            return (
                jsonify({"error": "LLM timeout", "code": "LLM_TIMEOUT"}),
                503,
            )
        elif "LLM_ERROR" in error_msg:
            logger.error(f"LLM error: {error_msg}")
            return (
                jsonify({"error": "LLM error", "code": "LLM_ERROR"}),
                503,
            )
        else:
            logger.error(f"Unexpected error: {error_msg}")
            return (
                jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
                500,
            )
