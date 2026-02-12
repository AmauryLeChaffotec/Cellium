"""LLM service for calling OpenAI API with structured JSON responses."""

import json
import os
from typing import Any

from dotenv import load_dotenv
from openai import APIError, APITimeoutError, OpenAI

load_dotenv()

# System prompt with 8 operation types
SYSTEM_PROMPT = """Tu es un assistant spécialisé dans la manipulation de tableurs.
Tu reçois une commande en langage naturel et un contexte de grille.
Tu dois retourner un JSON avec deux champs:
- "operations": un array d'opérations structurées parmi les 8 types suivants
- "description": une description en français de ce que tu as fait

Les 8 types d'opérations (format JSON exact à suivre):
1. SET_VALUE: { "type": "SET_VALUE", "cellId": "A1", "value": 123 }
2. SET_FORMULA: { "type": "SET_FORMULA", "cellId": "A1", "formula": "=SUM(B1:B10)" }
3. INSERT_ROW: { "type": "INSERT_ROW", "afterRow": 5, "cells": [{"id": "A6", "value": "Total"}] }
4. INSERT_COLUMN: { "type": "INSERT_COLUMN", "afterCol": "B", "header": "Prix Total", "cells": [...] }
5. DELETE_ROW: { "type": "DELETE_ROW", "row": 3 }
6. DELETE_COLUMN: { "type": "DELETE_COLUMN", "col": "C" }
7. SORT: { "type": "SORT", "column": "A", "direction": "asc" }
8. FORMAT: { "type": "FORMAT", "cellIds": ["A1", "A2"], "format": {"bold": true, "currency": "EUR"} }

Si la commande est ambiguë ou manque d'information, retourne:
{ "operations": [], "clarification": "Pouvez-vous préciser..." }

Exemples:
- Commande: "Ajoute une colonne nommée Prix" (contexte: 2 lignes de données en colonnes A-B)
  → { "operations": [{ "type": "INSERT_COLUMN", "afterCol": "B", "header": "Prix", "cells": [{"id": "C1", "value": "Prix"}] }], "description": "Colonne nommée Prix ajoutée après la colonne B" }
- Commande: "Ajoute une colonne Prix avec les valeurs 10, 20"
  → { "operations": [{ "type": "INSERT_COLUMN", "afterCol": "B", "header": "Prix", "cells": [{"id": "C1", "value": "Prix"}, {"id": "C2", "value": 10}, {"id": "C3", "value": 20}] }], "description": "Colonne Prix ajoutée avec 2 valeurs" }
- Commande: "Calcule la moyenne de la colonne B" (avec B1=5, B2=10 dans le contexte)
  → { "operations": [{ "type": "SET_FORMULA", "cellId": "B3", "formula": "=AVERAGE(B1:B2)" }], "description": "Formule pour calculer la moyenne de la colonne B ajoutée en B3" }

Règles strictes:
- Toujours retourner du JSON valide
- Les cellIds sont au format "A1", "B5" (lettre majuscule + numéro)
- Ne jamais inventer de données — utilise le contexte fourni
- IMPORTANT: Utilise UNIQUEMENT les lignes qui contiennent des données visibles dans le contexte
- Pour les formules/calculs, place le résultat dans la PREMIÈRE CELLULE VIDE de la colonne concernée (jamais au-delà de la ligne 10 sauf si spécifié)
- Pour INSERT_COLUMN:
  * Si un nom de colonne est demandé (ex: "Prix"), mets ce nom dans la première cellule (ex: C1)
  * Ajoute ensuite les valeurs demandées dans les cellules suivantes de cette colonne (ex: C2, C3, etc.)
  * Le champ "header" doit contenir le nom de la colonne
- Ne place JAMAIS de résultats dans des lignes au-delà du nombre de lignes avec données + 1
"""


def format_sample_rows(sample_rows: list[dict[str, Any]]) -> str:
    """Format sample rows for display in the user prompt.

    Args:
        sample_rows: List of row dictionaries where each key is a cellId

    Returns:
        Formatted string showing sample rows
    """
    if not sample_rows:
        return "  (aucun exemple disponible)"

    lines = []
    for i, row in enumerate(sample_rows[:5], 1):  # Max 5 samples
        cells = ", ".join(
            f"{cell_id}: {cell.get('value', '')}"
            for cell_id, cell in row.items()
        )
        lines.append(f"  Ligne {i}: {cells}")

    return "\n".join(lines)


def build_user_prompt(command: str, grid_context: dict[str, Any]) -> str:
    """Build user prompt from command and grid context.

    Args:
        command: Natural language command from user
        grid_context: Grid metadata (headers, columnTypes, rowCount, sampleRows)

    Returns:
        Formatted user prompt string
    """
    headers = ", ".join(grid_context.get("headers", []))
    column_types = grid_context.get("columnTypes", {})
    row_count = grid_context.get("rowCount", 0)
    sample_rows = grid_context.get("sampleRows", [])

    # Count actual data rows (rows with at least one value)
    actual_data_rows = len([row for row in sample_rows if any(
        cell.get('value') for cell in row.values() if isinstance(cell, dict)
    )])

    return f"""Commande: {command}

Contexte de la grille:
- Colonnes: {headers}
- Types de colonnes: {column_types}
- Nombre total de lignes dans la grille: {row_count}
- Nombre de lignes contenant des données: {actual_data_rows}
- Exemples de lignes avec données:
{format_sample_rows(sample_rows)}

IMPORTANT: Place les résultats dans les lignes contenant des données ou juste après (ligne {actual_data_rows + 1}), PAS à la ligne {row_count}.

Retourne le JSON avec operations et description.
"""


def call_llm(command: str, grid_context: dict[str, Any]) -> dict[str, Any]:
    """Call OpenAI LLM with command and grid context.

    Args:
        command: Natural language command from user
        grid_context: Grid metadata (NOT full grid - only headers, types, rowCount, samples)

    Returns:
        Dictionary with 'operations' (list) and 'description' (str)
        OR 'operations' (empty list) and 'clarification' (str) if ambiguous

    Raises:
        Exception: With message 'LLM_TIMEOUT' if timeout occurs
        Exception: With message 'LLM_ERROR' if other API error occurs
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment")

    client = OpenAI(api_key=api_key)

    user_prompt = build_user_prompt(command, grid_context)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using mini for cost efficiency
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},  # Force JSON
            timeout=10.0,  # 10 seconds max
        )

        result_str = response.choices[0].message.content
        if not result_str:
            raise Exception("LLM_ERROR: Empty response")

        parsed = json.loads(result_str)

        # Validate response structure
        if "operations" not in parsed:
            raise Exception("LLM_ERROR: Missing 'operations' field")

        if not isinstance(parsed["operations"], list):
            raise Exception("LLM_ERROR: 'operations' must be an array")

        # Check if it's a clarification response
        if len(parsed["operations"]) == 0 and "clarification" in parsed:
            return {
                "operations": [],
                "clarification": parsed["clarification"],
            }

        # Normal response with operations
        if "description" not in parsed:
            raise Exception("LLM_ERROR: Missing 'description' field")

        return {
            "operations": parsed["operations"],
            "description": parsed["description"],
        }

    except APITimeoutError as e:
        raise Exception("LLM_TIMEOUT") from e

    except APIError as e:
        raise Exception("LLM_ERROR") from e

    except json.JSONDecodeError as e:
        raise Exception("LLM_ERROR: Invalid JSON response") from e
