"""Shared helpers for the backend test suite."""

from __future__ import annotations

import json


def parse_sse_events(response_text: str) -> list[dict]:
    """Parse an SSE response body into a list of event dicts."""
    events: list[dict] = []
    for raw in response_text.strip().split("\n"):
        line = raw.strip()
        if not line or line.startswith(":"):
            continue
        payload = line[6:] if line.startswith("data: ") else line
        try:
            events.append(json.loads(payload))
        except json.JSONDecodeError:
            continue
    return events
