// ─── API Response Types ─────────────────────────────

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface EmotionScores {
  surrender: number;
  defiance: number;
  grief: number;
  hope: number;
  exhaustion: number;
  transcendence: number;
}

export interface CoverNode {
  id: string;
  artist: string;
  year: number;
  position: Position;
  emotion_scores: EmotionScores;
  era_tension: number;
  political_charge: number;
  is_original: boolean;
  // Optional metadata; backend `/api/graph` may or may not include genre.
  // The `/api/cover/{id}` detail endpoint always does.
  genre?: string;
  album?: string;
  artist_image_url?: string | null;
  youtube_video_id?: string | null;
  music_source_kind?: string | null;
}

export interface GraphResponse {
  covers: CoverNode[];
}

export interface CoverDetail extends CoverNode {
  album: string;
  genre: string;
  context_notes: string;
  meaning_shift: string;
  historical_pulse: string;
  spiritual_weight: number;
  music_source_label?: string | null;
}

export interface CompareRequest {
  cover_id_a: string;
  cover_id_b: string;
}

export interface CompareResponse {
  analysis: string;
  analysis_source: "llm" | "local_fallback";
  shift_direction: string;
  key_year_a: number;
  key_year_b: number;
  historical_context_a: string;
  historical_context_b: string;
}

export interface VoiceRequest {
  cover_id: string;
}

export interface VoiceResponse {
  monologue: string;
  monologue_source: "llm" | "local_fallback";
  year: number;
  artist: string;
  rag_sources_used: string[];
}

export interface MatchRequest {
  user_text: string;
}

export interface MatchedCover {
  id: string;
  artist: string;
  year: number;
}

export interface MatchResponse {
  matched_cover: MatchedCover;
  similarity_score: number;
  bridge_text: string;
  user_position: Position;
  match_method: "embedding" | "keyword_fallback";
  bridge_source: "llm" | "local_fallback";
}

export interface HealthResponse {
  status: string;
  app: string;
  environment: string;
  llm_provider: string;
  llm_configured: boolean;
  raw_covers_exists: boolean;
  processed_covers_exists: boolean;
  raw_cover_count: number;
  processed_cover_count: number;
  processed_data_stale: boolean;
}

// ─── App State ──────────────────────────────────────

export type AppMode =
  | "explore"
  | "match"
  | "compare"
  | "voice"
  | "archive";

export type CompareStep = "idle" | "selecting_second" | "result";

export interface AppState {
  mode: AppMode;
  selectedCoverId: string | null;
  coverDetail: CoverDetail | null;
  compareStep: CompareStep;
  compareCoverIdA: string | null;
  compareCoverIdB: string | null;
  compareResult: CompareResponse | null;
  voiceResult: VoiceResponse | null;
  matchResult: MatchResponse | null;
  decadeFilter: string | null; // e.g. "1970s", null = all
  loading: boolean;
  error: string | null;
}
