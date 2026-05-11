import type { UploadResponse } from "./types";

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export async function uploadRecipe(file: File, options?: { signal?: AbortSignal }): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${backendUrl}/upload`, {
    method: "POST",
    body: form,
    signal: options?.signal,
  });

  if (!response.ok) {
    const detail = await readError(response);
    throw new Error(detail || `Upload failed with HTTP ${response.status}`);
  }

  return response.json() as Promise<UploadResponse>;
}

async function readError(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? null;
  } catch {
    return null;
  }
}
