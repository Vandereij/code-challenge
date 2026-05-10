# Recipe Companion Frontend

Tablet-first React frontend for the Recipe Companion challenge. It uses Vite, Tailwind CSS v4, and a small Express CopilotKit runtime bridge for the AG-UI backend agent.

## Run

Start the Python backend first:

```bash
cd ../backend
uv sync
uv run uvicorn src.main:app --reload --port 8000
```

Then start the frontend:

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Environment

Defaults assume the backend is on `http://localhost:8000`.

```env
VITE_BACKEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
RUNTIME_PORT=3001
```

`VITE_BACKEND_URL` is used by the browser for `/upload`. `BACKEND_URL` is used by the local runtime bridge for `/copilotkit`.

## Design Notes

- The layout targets a 1024 by 768 landscape tablet first.
- Touch targets are intentionally large for messy kitchen use.
- The recipe state comes from CopilotKit shared state. Chat tool calls update the same state the recipe view renders.
- Ingredient checks are local shared-state updates, while scaling, substitutions, and progress can be driven by the agent.
