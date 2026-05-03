import type {
  GraphResponse,
  CoverDetail,
  CompareRequest,
  CompareResponse,
  VoiceRequest,
  VoiceResponse,
  MatchRequest,
  MatchResponse,
  HealthResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 60_000;

// ─── Fetch wrapper ──────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let message = body || res.statusText;
      try {
        const parsed = JSON.parse(body) as { detail?: unknown };
        if (typeof parsed.detail === "string") message = parsed.detail;
      } catch {
        // Keep the raw response body when the API does not return JSON.
      }
      throw new Error(message);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Endpoints ──────────────────────────────────────

export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

export async function getGraph(): Promise<GraphResponse> {
  return apiFetch<GraphResponse>("/api/graph");
}

export async function getCover(coverId: string): Promise<CoverDetail> {
  return apiFetch<CoverDetail>(`/api/cover/${encodeURIComponent(coverId)}`);
}

export async function postCompare(
  body: CompareRequest
): Promise<CompareResponse> {
  return apiFetch<CompareResponse>("/api/compare", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function postVoice(
  body: VoiceRequest
): Promise<VoiceResponse> {
  return apiFetch<VoiceResponse>("/api/voice", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function postMatch(
  body: MatchRequest
): Promise<MatchResponse> {
  return apiFetch<MatchResponse>("/api/match", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
