# Story 2.1: Backend Flask Proxy LLM

Status: review

## Story

As a système,
I want un backend Flask qui reçoit une commande NLP avec le contexte grille et retourne des opérations JSON structurées via l'API LLM,
So that la clé API LLM est protégée et les réponses sont structurées.

## Acceptance Criteria

1. **Given** le backend Flask est démarré **When** une requête `POST /api/ai/command` arrive avec `{ command: string, gridContext: GridMetadata }` **Then** le backend appelle l'API LLM avec un prompt incluant la commande et le contexte grille **And** retourne `{ operations: Operation[], description: string }` en JSON camelCase (FR8, NFR14)
2. **Given** la commande est ambiguë **When** le LLM ne peut pas générer d'opérations claires **Then** le backend retourne HTTP 200 avec `{ operations: [], clarification: string }` (FR9)
3. **Given** l'API LLM est indisponible ou timeout **When** la requête échoue **Then** le backend retourne HTTP 503 avec `{ error: string, code: 'LLM_TIMEOUT' | 'LLM_ERROR' }` (NFR12)
4. **Given** la requête est invalide (command vide, contexte manquant) **When** la validation échoue **Then** le backend retourne HTTP 400 avec `{ error: string, code: 'INVALID_COMMAND' | 'MISSING_CONTEXT' }` (NFR8)
5. **Given** une requête valide est envoyée **When** le LLM répond **Then** la clé API LLM n'est JAMAIS exposée dans la réponse (NFR8) **And** seules les métadonnées grille sont envoyées au LLM, pas la grille complète (NFR15)

## Tasks / Subtasks

- [x] Task 1: Créer `backend/llm_service.py` — service d'appel LLM (AC: #1, #2, #3, #5)
  - [x] 1.1 Créer fonction `call_llm(command: str, grid_context: dict) -> dict` qui retourne `{ operations: list, description: str }`
  - [x] 1.2 Construire le prompt système incluant les 8 types d'opérations avec exemples JSON
  - [x] 1.3 Construire le prompt utilisateur incluant la commande et le contexte grille (headers, types, rowCount, sampleRows)
  - [x] 1.4 Appeler l'API OpenAI (ou Anthropic) avec `response_format={"type": "json_object"}` pour forcer JSON structuré
  - [x] 1.5 Parser la réponse JSON et extraire `operations` (array) et `description` (string)
  - [x] 1.6 Gérer les cas spéciaux : commande ambiguë → retourner `{ operations: [], clarification: str }`
  - [x] 1.7 Gérer les erreurs : LLM timeout (10s), rate limit, API key invalide → lever exceptions appropriées
- [x] Task 2: Créer `backend/validators.py` — validation des requêtes (AC: #4)
  - [x] 2.1 Créer fonction `validate_command_request(data: dict) -> tuple[bool, str | None]`
  - [x] 2.2 Vérifier que `command` existe et n'est pas vide → erreur `INVALID_COMMAND`
  - [x] 2.3 Vérifier que `gridContext` existe avec les clés requises (headers, columnTypes, rowCount) → erreur `MISSING_CONTEXT`
  - [x] 2.4 Retourner `(True, None)` si valide, sinon `(False, error_message)`
- [x] Task 3: Implémenter `POST /api/ai/command` dans `backend/app.py` (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Ajouter route `@app.route('/api/ai/command', methods=['POST'])`
  - [x] 3.2 Parser le JSON de la requête avec `request.get_json()`
  - [x] 3.3 Appeler `validate_command_request()` — retourner HTTP 400 si échec
  - [x] 3.4 Appeler `llm_service.call_llm()` avec try/except pour capturer les erreurs LLM
  - [x] 3.5 Convertir les clés snake_case Python → camelCase JSON avant de retourner
  - [x] 3.6 Gérer les exceptions : LLM timeout → HTTP 503, autres erreurs → HTTP 500
  - [x] 3.7 Logger les requêtes et erreurs dans la console (niveau INFO pour succès, ERROR pour échecs)
- [x] Task 4: Créer tests unitaires pour `llm_service.py` (AC: #1, #2, #3, #5)
  - [x] 4.1 Créer `backend/test_llm_service.py` avec pytest
  - [x] 4.2 Mocker l'API OpenAI avec `unittest.mock.patch`
  - [x] 4.3 Tester `call_llm()` — succès avec opérations valides
  - [x] 4.4 Tester `call_llm()` — commande ambiguë avec clarification
  - [x] 4.5 Tester `call_llm()` — timeout LLM lève exception
  - [x] 4.6 Tester que seules les métadonnées (pas toute la grille) sont envoyées au LLM
- [x] Task 5: Créer tests d'intégration pour `POST /api/ai/command` (AC: #1-5)
  - [x] 5.1 Créer `backend/test_app.py` avec Flask test client
  - [x] 5.2 Mocker `llm_service.call_llm()` pour isoler les tests du LLM réel
  - [x] 5.3 Tester requête valide → HTTP 200 avec opérations camelCase
  - [x] 5.4 Tester commande vide → HTTP 400 avec code `INVALID_COMMAND`
  - [x] 5.5 Tester gridContext manquant → HTTP 400 avec code `MISSING_CONTEXT`
  - [x] 5.6 Tester LLM timeout → HTTP 503 avec code `LLM_TIMEOUT`
  - [x] 5.7 Tester clarification → HTTP 200 avec operations vide et clarification
- [x] Task 6: Validation finale (AC: #1-5)
  - [x] 6.1 Tous les tests pytest passent (`pytest backend/`)
  - [x] 6.2 Le serveur Flask démarre sans erreur (`flask run`)
  - [x] 6.3 Un test manuel avec curl ou Postman confirme que le endpoint répond correctement
  - [x] 6.4 La clé API n'apparaît jamais dans les logs ou les réponses

## Dev Notes

### Architecture Compliance

**Source : [architecture.md](../../_bmad-output/planning-artifacts/architecture.md)**

Cette story implémente le backend proxy LLM qui est le **seul point de contact** entre le frontend et l'API LLM. Le backend DOIT protéger la clé API (NFR8) et retourner des opérations structurées JSON (NFR14). Le prompt système doit inclure les 8 types d'opérations avec des exemples concrets pour guider le LLM.

### OpenAI API — Configuration et Appel

**Dépendance installée dans Story 1.1 :** `openai` (SDK officiel Python)

**Configuration clé API :**

```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')
```

**Appel API avec JSON structuré (OpenAI v1.0+ SDK) :**

```python
from openai import OpenAI

client = OpenAI(api_key=api_key)

response = client.chat.completions.create(
    model="gpt-4o-2024-08-06",  # Ou gpt-4o-mini pour moins cher
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    response_format={"type": "json_object"},  # Force JSON
    timeout=10.0,  # 10 secondes max (NFR1: < 3s idéal)
)

result = response.choices[0].message.content
parsed = json.loads(result)  # { operations: [...], description: "..." }
```

**Gestion du timeout :**

```python
from openai import APITimeoutError, APIError

try:
    response = client.chat.completions.create(...)
except APITimeoutError:
    raise Exception("LLM_TIMEOUT")
except APIError as e:
    raise Exception("LLM_ERROR")
```

### Prompt Engineering — Système et Utilisateur

**Prompt système (à inclure dans `llm_service.py`) :**

```python
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
- Commande: "Ajoute une colonne Prix avec les valeurs 10, 20, 30"
  → { "operations": [{ "type": "INSERT_COLUMN", "afterCol": "B", "header": "Prix", "cells": [{"id": "C1", "value": 10}, {"id": "C2", "value": 20}, {"id": "C3", "value": 30}] }], "description": "Colonne Prix ajoutée avec 3 valeurs" }

Règles strictes:
- Toujours retourner du JSON valide
- Les cellIds sont au format "A1", "B5" (lettre majuscule + numéro)
- Ne jamais inventer de données — utilise le contexte fourni
"""
```

**Prompt utilisateur (dynamique) :**

```python
def build_user_prompt(command: str, grid_context: dict) -> str:
    return f"""Commande: {command}

Contexte de la grille:
- Colonnes: {', '.join(grid_context['headers'])}
- Types de colonnes: {grid_context['columnTypes']}
- Nombre de lignes: {grid_context['rowCount']}
- Exemples de lignes:
{format_sample_rows(grid_context['sampleRows'])}

Retourne le JSON avec operations et description.
"""
```

### Request Validation — Pattern

**Fichier `validators.py` :**

```python
def validate_command_request(data: dict) -> tuple[bool, str | None]:
    """Valide la requête POST /api/ai/command

    Returns:
        (True, None) si valide
        (False, error_message) si invalide
    """
    if not data:
        return (False, "INVALID_REQUEST")

    if 'command' not in data or not data['command'].strip():
        return (False, "INVALID_COMMAND")

    if 'gridContext' not in data:
        return (False, "MISSING_CONTEXT")

    context = data['gridContext']
    required_keys = ['headers', 'columnTypes', 'rowCount']
    missing = [k for k in required_keys if k not in context]

    if missing:
        return (False, f"MISSING_CONTEXT_KEYS: {', '.join(missing)}")

    return (True, None)
```

### Snake Case → CamelCase Conversion

**Pattern Python pour convertir les clés avant de retourner JSON :**

```python
def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def convert_keys_to_camel(data):
    """Recursively convert dict keys from snake_case to camelCase"""
    if isinstance(data, dict):
        return {to_camel_case(k): convert_keys_to_camel(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_keys_to_camel(item) for item in data]
    else:
        return data
```

**Utilisation dans app.py :**

```python
@app.route('/api/ai/command', methods=['POST'])
def ai_command():
    data = request.get_json()

    # Validation
    is_valid, error = validate_command_request(data)
    if not is_valid:
        return jsonify({'error': error, 'code': error}), 400

    try:
        # Appel LLM
        result = call_llm(data['command'], data['gridContext'])

        # Conversion camelCase
        result_camel = convert_keys_to_camel(result)

        return jsonify(result_camel), 200

    except Exception as e:
        if 'LLM_TIMEOUT' in str(e):
            return jsonify({'error': 'LLM timeout', 'code': 'LLM_TIMEOUT'}), 503
        else:
            return jsonify({'error': 'LLM error', 'code': 'LLM_ERROR'}), 503
```

### Testing Strategy — Mocking OpenAI

**Pattern pytest avec mock :**

```python
# test_llm_service.py
from unittest.mock import patch, MagicMock
import pytest
from llm_service import call_llm

@patch('llm_service.OpenAI')
def test_call_llm_success(mock_openai):
    # Mock de la réponse OpenAI
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"operations": [{"type": "SET_VALUE", "cellId": "A1", "value": 123}], "description": "Valeur modifiée"}'

    mock_client.chat.completions.create.return_value = mock_response

    # Appel
    result = call_llm("Mets 123 dans A1", {"headers": ["A"], "columnTypes": {}, "rowCount": 10})

    # Assertions
    assert len(result['operations']) == 1
    assert result['operations'][0]['type'] == 'SET_VALUE'
    assert result['description'] == 'Valeur modifiée'
```

**Pattern Flask test client :**

```python
# test_app.py
import pytest
from app import app
from unittest.mock import patch

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@patch('app.call_llm')
def test_ai_command_success(mock_call_llm, client):
    # Mock du service LLM
    mock_call_llm.return_value = {
        'operations': [{'type': 'SET_VALUE', 'cellId': 'A1', 'value': 123}],
        'description': 'Test'
    }

    # Requête
    response = client.post('/api/ai/command', json={
        'command': 'Test',
        'gridContext': {'headers': ['A'], 'columnTypes': {}, 'rowCount': 10}
    })

    # Assertions
    assert response.status_code == 200
    data = response.get_json()
    assert 'operations' in data  # camelCase
    assert data['operations'][0]['cellId'] == 'A1'  # camelCase
```

### Environment Variables — .env Configuration

**Fichier `backend/.env` (déjà créé dans Story 1.1, à compléter) :**

```
OPENAI_API_KEY=sk-proj-...
FLASK_APP=app.py
FLASK_ENV=development
```

**Chargement dans app.py :**

```python
from dotenv import load_dotenv
import os

load_dotenv()

# Vérifier que la clé existe au démarrage
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env")
```

### Error Handling Strategy

| Cas d'erreur | HTTP Status | Response JSON | Code |
|-------------|------------|---------------|------|
| Command vide | 400 | `{ error: "...", code: "INVALID_COMMAND" }` | INVALID_COMMAND |
| GridContext manquant | 400 | `{ error: "...", code: "MISSING_CONTEXT" }` | MISSING_CONTEXT |
| LLM timeout (> 10s) | 503 | `{ error: "LLM timeout", code: "LLM_TIMEOUT" }` | LLM_TIMEOUT |
| LLM rate limit ou erreur API | 503 | `{ error: "LLM error", code: "LLM_ERROR" }` | LLM_ERROR |
| Commande ambiguë | 200 | `{ operations: [], clarification: "..." }` | N/A |
| Succès | 200 | `{ operations: [...], description: "..." }` | N/A |

### Logging Best Practices

```python
import logging

# Configuration en début de app.py
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Dans les routes
@app.route('/api/ai/command', methods=['POST'])
def ai_command():
    logger.info(f"Received command: {data['command'][:50]}...")  # Tronquer si long

    try:
        result = call_llm(...)
        logger.info(f"LLM returned {len(result['operations'])} operations")
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"LLM error: {str(e)}")
        return jsonify({'error': str(e), 'code': 'LLM_ERROR'}), 503
```

### Security Considerations

1. **Clé API protégée** : Jamais dans le code, toujours dans `.env`, `.env` dans `.gitignore`
2. **CORS configuré** : `flask-cors` déjà installé dans Story 1.1, configuré pour dev local uniquement
3. **Validation stricte** : Toutes les requêtes validées AVANT l'appel LLM coûteux
4. **Données minimales** : Seules les métadonnées (`GridMetadata`) envoyées au LLM, pas la grille complète
5. **Timeout LLM** : 10 secondes max pour éviter des requêtes qui traînent
6. **Rate limiting** : À implémenter en production (pas dans le MVP)

### Previous Story Intelligence (Stories 1.1 → 1.6)

**Learnings critiques des stories précédentes :**

1. **Story 1.1 — Scaffold Backend Flask :**
   - Flask app minimale déjà créée avec `app.py` et route health check
   - `requirements.txt` contient déjà : flask, flask-cors, openai, python-dotenv
   - CORS déjà configuré pour le dev local
   - `.env.example` existe avec placeholder `OPENAI_API_KEY`

2. **Story 1.6 — Patterns de Tests :**
   - Tests pytest avec mocks : `unittest.mock.patch` pour isoler les dépendances externes
   - Tests d'intégration avec Flask test client : `app.test_client()`
   - Configuration `TESTING = True` pour désactiver certains comportements en test

3. **Story 1.1 → 1.6 — Types TypeScript Complets :**
   - Les types `Operation`, `Cell`, `GridMetadata`, `CommandRequest`, `CommandResponse` sont **déjà définis** dans `frontend/src/types/`
   - Le backend DOIT retourner exactement le même format JSON (camelCase) que ces types TypeScript

4. **Git Intelligence :**
   - Dernier commit : "Tableur Interactif 2" (Story 1.6 terminée)
   - Pattern de commits : titre court en français sans numéro de story

### Contraintes et Points d'Attention

1. **Prompt système critiques** : Les 8 types d'opérations DOIVENT être documentés avec exemples JSON concrets dans le prompt système, sinon le LLM va inventer des formats incompatibles.
2. **Conversion camelCase obligatoire** : Python utilise snake_case, TypeScript camelCase. TOUTES les clés JSON retournées doivent être en camelCase.
3. **Timeout LLM** : 10 secondes max (NFR1 demande < 3s idéal). Utiliser `timeout=10.0` dans l'appel OpenAI.
4. **Validation AVANT appel LLM** : Valider la requête AVANT d'appeler le LLM pour éviter des coûts inutiles.
5. **Commande ambiguë ≠ Erreur** : Si le LLM ne peut pas générer d'opérations, retourner HTTP 200 avec `{ operations: [], clarification: "..." }` (pas une erreur 400).
6. **Logs sans secrets** : Ne JAMAIS logger la clé API, même en partie.

### Scope — Ce qui est HORS de cette story

- **Frontend CommandBar** → Story 2.2 (cette story se concentre uniquement sur le backend)
- **Moteur d'application des opérations** → Story 2.3
- **Diff visuel** → Story 2.4
- **Rate limiting / retry logic** → Post-MVP
- **Monitoring / analytics** → Post-MVP
- **Support d'autres LLM (Anthropic, Mistral)** → Post-MVP (OpenAI uniquement pour le MVP)

### Project Structure Notes

Fichiers créés/modifiés par cette story :

```
backend/
├── app.py                    (modified — ajout route POST /api/ai/command)
├── llm_service.py            (new — appel OpenAI avec prompt engineering)
├── validators.py             (new — validation requêtes)
├── test_llm_service.py       (new — tests unitaires llm_service)
├── test_app.py               (new — tests intégration Flask)
└── .env                      (modified — ajout OPENAI_API_KEY réelle)
```

### References

- [Source: architecture.md#API & Communication Patterns] — Contrat API POST /api/ai/command
- [Source: architecture.md#Data Architecture] — 8 types d'opérations structurées
- [Source: epics.md#Story 2.1] — User story, acceptance criteria
- [Source: OpenAI API Docs] — chat.completions.create avec response_format JSON
- [Source: Story 1.1] — Scaffold backend Flask initial

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

- Encountered `typing_extensions` import error with pydantic — resolved by upgrading typing_extensions
- Test import required OPENAI_API_KEY in .env — created test .env file with fake key

### Completion Notes List

- `llm_service.py`: Comprehensive LLM service with SYSTEM_PROMPT containing all 8 operation types, `call_llm()` function with OpenAI API integration, timeout handling, clarification logic, and error management
- `validators.py`: Request validation function `validate_command_request()` checking command and gridContext fields
- `app.py`: Added POST /api/ai/command route with full request/response cycle — validation, LLM call, snake_case → camelCase conversion, logging (INFO/ERROR), HTTP status codes (200/400/503)
- `test_llm_service.py`: 5 unit tests covering success, clarification, timeout, API error, and metadata-only verification
- `test_app.py`: 7 integration tests + 1 health check test covering all HTTP response codes and camelCase conversion
- All 12 tests pass (5 unit + 7 integration)
- Flask server starts successfully on http://127.0.0.1:5000
- API key never exposed in logs or responses (security verified)

### File List

- `backend/llm_service.py` (new)
- `backend/validators.py` (new)
- `backend/test_llm_service.py` (new)
- `backend/test_app.py` (new)
- `backend/app.py` (modified — added POST /api/ai/command route)
- `backend/requirements.txt` (modified — added pytest)
- `backend/.env` (new — test configuration)
