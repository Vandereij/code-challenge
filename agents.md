# AGENTS.md

Context for AI coding assistants (Claude Code, Codex, Cursor, Copilot) working in this repo.

## What this repo is

A coding challenge. A candidate is building a **frontend** that talks to the Python backend in `backend/`. The backend is done and should not be changed unless the user asks. Your job is to help build, not to refactor the backend.

## Layout

```
.
├── README.md            # The challenge brief (read this first)
├── backend/             # FastAPI + pydantic-ai. Done. Don't touch unless asked.
│   ├── README.md        # Endpoints, state model, agent tools, env vars
│   ├── src/
│   │   ├── main.py      # FastAPI app: /upload, /copilotkit (AG-UI mount), /health
│   │   ├── agents.py    # pydantic-ai agents + tools (scale, substitute, progress)
│   │   └── models.py    # Pydantic types (Recipe, RecipeContext, ...)
│   └── tests/
├── docker-compose.yml
└── data/                # Sample recipes
```

A frontend directory does not exist yet. The candidate creates it.

## Stack

- **Backend:** Python 3.11+, `uv`, FastAPI, pydantic-ai, AG-UI protocol. Runs on port 8000.
- **Frontend:** Candidate's choice. CopilotKit is expected because the backend speaks AG-UI.

## Commands

Backend (run from `backend/`):

```bash
uv sync --extra test
uv run uvicorn src.main:app --reload --port 8000
make test              # all tests
make test-unit         # fast, no API calls
make test-integration  # hits real LLM, needs a key
make lint              # ruff check
make format            # ruff format
```

Full stack: `docker-compose up backend`.

## Backend contract (what the frontend needs)

- `POST /upload` — returns `{ threadId, state: RecipeContext, ... }`. State goes into `useCoAgent`.
- `POST /copilotkit` — AG-UI endpoint. Point the CopilotKit runtime here.
- State shape in `backend/src/models.py` — `RecipeContext` is the source of truth.
- Agent name: `recipe_agent`. Tools: `scale_recipe`, `substitute_ingredient`, `update_cooking_progress`.

See `backend/README.md` for examples and payload shapes. OpenAPI at `http://localhost:8000/docs` when the server is running.

## Conventions

- **Python:** ruff for lint and format. British English in comments and docs where it matters. No new files unless needed. Prefer editing existing files.
- **Env:** `LLM_MODEL` prefix picks the provider — `gpt-*`, `o1`, `o3`, `o4` → OpenAI; `gemini-*` → Google. Adding a new provider means extending `build_model()` in `backend/src/agents.py`.
- **State mutation:** The agent changes state through tool calls that return `StateSnapshotEvent`. The frontend reacts to state, it should not parse chat content.
- **Commits:** Small, real messages. The candidate's git history is reviewed.

## Gotchas

- `starlette` is pinned `<1.0` in `backend/pyproject.toml`. Starlette 1.0 dropped `on_startup`/`on_shutdown`, which pydantic-ai's AG-UI app still uses. Don't remove the pin unless pydantic-ai has fixed it.
- `load_dotenv()` looks at the current working directory. The repo's `.env` lives at the root for Docker; the backend process expects one inside `backend/` when run directly.
- `.env` values must **not** be quoted. python-dotenv strips quotes, `docker-compose`'s `env_file` does not. `LLM_MODEL="gpt-4o"` works locally, breaks in Docker.
- Integration tests hit real LLM APIs. They cost money on OpenAI and burn Gemini free-tier quota. Don't run them in a loop.
- The backend hardcodes model selection via `build_model()`. Don't reintroduce `GoogleModel(MODEL_NAME)` directly — it breaks OpenAI configurations.

## Out of scope

- Do not refactor the backend unless asked.
- Do not upgrade dependencies unless asked. Upgrades have already broken `starlette` once.
- Do not add feature flags, abstractions, or "future-proofing" layers. This is a challenge, not a product.

## Style

- Direct, short sentences. British spelling.
- No emojis unless the user asks.
- No motivational fluff. State the fact, move on.
