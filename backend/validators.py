"""Request validation for API endpoints."""

from typing import Any


def validate_command_request(data: dict[str, Any] | None) -> tuple[bool, str | None]:
    """Validate POST /api/ai/command request data.

    Args:
        data: Request JSON data (can be None if parsing failed)

    Returns:
        Tuple of (is_valid, error_code)
        - (True, None) if valid
        - (False, error_code) if invalid with error code string
    """
    if data is None:
        return (False, "INVALID_REQUEST")

    # Validate command field
    if "command" not in data:
        return (False, "INVALID_COMMAND")

    command = data["command"]
    if not isinstance(command, str) or not command.strip():
        return (False, "INVALID_COMMAND")

    # Validate gridContext field
    if "gridContext" not in data:
        return (False, "MISSING_CONTEXT")

    grid_context = data["gridContext"]
    if not isinstance(grid_context, dict):
        return (False, "MISSING_CONTEXT")

    # Validate required keys in gridContext
    required_keys = ["headers", "columnTypes", "rowCount"]
    missing_keys = [k for k in required_keys if k not in grid_context]

    if missing_keys:
        return (False, f"MISSING_CONTEXT")

    return (True, None)
