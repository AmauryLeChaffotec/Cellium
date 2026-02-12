"""Integration tests for Flask API endpoints."""

from unittest.mock import patch

import pytest

from app import app


@pytest.fixture
def client():
    """Create Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@patch("app.call_llm")
def test_ai_command_success(mock_call_llm, client):
    """Test successful AI command request returns 200 with camelCase operations."""
    # Mock LLM service
    mock_call_llm.return_value = {
        "operations": [
            {"type": "SET_VALUE", "cell_id": "A1", "value": 123}
        ],  # snake_case
        "description": "Test description",
    }

    # Request
    response = client.post(
        "/api/ai/command",
        json={
            "command": "Set A1 to 123",
            "gridContext": {
                "headers": ["A"],
                "columnTypes": {"A": "number"},
                "rowCount": 10,
            },
        },
    )

    # Assertions
    assert response.status_code == 200
    data = response.get_json()
    assert "operations" in data
    assert "description" in data
    assert len(data["operations"]) == 1
    # Verify camelCase conversion
    assert data["operations"][0]["cellId"] == "A1"  # camelCase
    assert data["operations"][0]["type"] == "SET_VALUE"
    assert data["operations"][0]["value"] == 123


@patch("app.call_llm")
def test_ai_command_empty_command(mock_call_llm, client):
    """Test empty command returns 400 with INVALID_COMMAND code."""
    response = client.post(
        "/api/ai/command",
        json={
            "command": "",
            "gridContext": {
                "headers": ["A"],
                "columnTypes": {},
                "rowCount": 10,
            },
        },
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "code" in data
    assert data["code"] == "INVALID_COMMAND"


@patch("app.call_llm")
def test_ai_command_missing_grid_context(mock_call_llm, client):
    """Test missing gridContext returns 400 with MISSING_CONTEXT code."""
    response = client.post(
        "/api/ai/command",
        json={
            "command": "Test",
        },
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "code" in data
    assert data["code"] == "MISSING_CONTEXT"


@patch("app.call_llm")
def test_ai_command_llm_timeout(mock_call_llm, client):
    """Test LLM timeout returns 503 with LLM_TIMEOUT code."""
    # Mock LLM timeout
    mock_call_llm.side_effect = Exception("LLM_TIMEOUT")

    response = client.post(
        "/api/ai/command",
        json={
            "command": "Test",
            "gridContext": {
                "headers": ["A"],
                "columnTypes": {},
                "rowCount": 10,
            },
        },
    )

    assert response.status_code == 503
    data = response.get_json()
    assert "error" in data
    assert "code" in data
    assert data["code"] == "LLM_TIMEOUT"


@patch("app.call_llm")
def test_ai_command_llm_error(mock_call_llm, client):
    """Test LLM error returns 503 with LLM_ERROR code."""
    # Mock LLM error
    mock_call_llm.side_effect = Exception("LLM_ERROR: Something went wrong")

    response = client.post(
        "/api/ai/command",
        json={
            "command": "Test",
            "gridContext": {
                "headers": ["A"],
                "columnTypes": {},
                "rowCount": 10,
            },
        },
    )

    assert response.status_code == 503
    data = response.get_json()
    assert "error" in data
    assert "code" in data
    assert data["code"] == "LLM_ERROR"


@patch("app.call_llm")
def test_ai_command_clarification(mock_call_llm, client):
    """Test clarification response returns 200 with empty operations and clarification."""
    # Mock clarification response
    mock_call_llm.return_value = {
        "operations": [],
        "clarification": "Could you specify which column?",
    }

    response = client.post(
        "/api/ai/command",
        json={
            "command": "Sort the data",
            "gridContext": {
                "headers": ["A", "B"],
                "columnTypes": {},
                "rowCount": 10,
            },
        },
    )

    assert response.status_code == 200
    data = response.get_json()
    assert "operations" in data
    assert "clarification" in data
    assert len(data["operations"]) == 0
    assert "specify" in data["clarification"].lower()


def test_health_endpoint(client):
    """Test health check endpoint returns ok status."""
    response = client.get("/api/health")

    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
