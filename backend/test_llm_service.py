"""Unit tests for llm_service.py"""

from unittest.mock import MagicMock, patch

import pytest

from llm_service import call_llm


@patch("llm_service.OpenAI")
def test_call_llm_success(mock_openai):
    """Test successful LLM call with valid operations."""
    # Mock OpenAI client
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    # Mock response
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"operations": [{"type": "SET_VALUE", "cellId": "A1", "value": 123}], "description": "Valeur modifiée"}'

    mock_client.chat.completions.create.return_value = mock_response

    # Call
    grid_context = {
        "headers": ["A"],
        "columnTypes": {"A": "number"},
        "rowCount": 10,
        "sampleRows": [],
    }
    result = call_llm("Mets 123 dans A1", grid_context)

    # Assertions
    assert "operations" in result
    assert "description" in result
    assert len(result["operations"]) == 1
    assert result["operations"][0]["type"] == "SET_VALUE"
    assert result["operations"][0]["cellId"] == "A1"
    assert result["operations"][0]["value"] == 123
    assert result["description"] == "Valeur modifiée"


@patch("llm_service.OpenAI")
def test_call_llm_clarification(mock_openai):
    """Test LLM returns clarification when command is ambiguous."""
    # Mock OpenAI client
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    # Mock clarification response
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = (
        '{"operations": [], "clarification": "Pouvez-vous préciser la colonne ?"}'
    )

    mock_client.chat.completions.create.return_value = mock_response

    # Call
    grid_context = {
        "headers": ["A", "B"],
        "columnTypes": {},
        "rowCount": 10,
        "sampleRows": [],
    }
    result = call_llm("Trie les données", grid_context)

    # Assertions
    assert "operations" in result
    assert "clarification" in result
    assert len(result["operations"]) == 0
    assert "préciser" in result["clarification"].lower()


@patch("llm_service.OpenAI")
def test_call_llm_timeout(mock_openai):
    """Test LLM timeout raises exception with LLM_TIMEOUT message."""
    from openai import APITimeoutError

    # Mock OpenAI client
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    # Mock timeout error
    mock_client.chat.completions.create.side_effect = APITimeoutError("Timeout")

    # Call should raise exception
    grid_context = {
        "headers": ["A"],
        "columnTypes": {},
        "rowCount": 10,
        "sampleRows": [],
    }

    with pytest.raises(Exception) as exc_info:
        call_llm("Test", grid_context)

    assert "LLM_TIMEOUT" in str(exc_info.value)


@patch("llm_service.OpenAI")
def test_call_llm_api_error(mock_openai):
    """Test LLM API error raises exception with LLM_ERROR message."""
    from openai import APIError
    from openai._exceptions import BadRequestError

    # Mock OpenAI client
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    # Mock API error
    mock_client.chat.completions.create.side_effect = BadRequestError(
        "Bad request", response=MagicMock(status_code=400), body={}
    )

    # Call should raise exception
    grid_context = {
        "headers": ["A"],
        "columnTypes": {},
        "rowCount": 10,
        "sampleRows": [],
    }

    with pytest.raises(Exception) as exc_info:
        call_llm("Test", grid_context)

    assert "LLM_ERROR" in str(exc_info.value)


@patch("llm_service.OpenAI")
def test_call_llm_only_sends_metadata(mock_openai):
    """Test that only metadata is sent to LLM, not the full grid."""
    # Mock OpenAI client
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    # Mock response
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = (
        '{"operations": [], "description": "Test"}'
    )

    mock_client.chat.completions.create.return_value = mock_response

    # Call with grid context (metadata only, no full grid)
    grid_context = {
        "headers": ["A", "B", "C"],
        "columnTypes": {"A": "text", "B": "number", "C": "number"},
        "rowCount": 100,
        "sampleRows": [
            {"A1": {"value": "Item"}, "B1": {"value": 10}, "C1": {"value": 20}}
        ],
    }
    call_llm("Test command", grid_context)

    # Verify OpenAI was called
    assert mock_client.chat.completions.create.called

    # Get the actual call arguments
    call_args = mock_client.chat.completions.create.call_args

    # Verify user prompt contains metadata
    user_prompt = call_args[1]["messages"][1]["content"]
    assert "Colonnes: A, B, C" in user_prompt
    assert "Nombre de lignes: 100" in user_prompt
    assert "Types de colonnes:" in user_prompt

    # Verify it does NOT contain full grid data
    # (sample rows are ok, but we verify it's not thousands of cells)
    assert "A1" in user_prompt  # Sample is ok
    assert grid_context == {  # Context unchanged (not modified)
        "headers": ["A", "B", "C"],
        "columnTypes": {"A": "text", "B": "number", "C": "number"},
        "rowCount": 100,
        "sampleRows": [
            {"A1": {"value": "Item"}, "B1": {"value": 10}, "C1": {"value": 20}}
        ],
    }
