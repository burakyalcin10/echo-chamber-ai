import type { CoverNode, EmotionScores } from "./types";

export type RelationshipMode =
  | "all"
  | "emotional"
  | "historical"
  | "genre"
  | "influence";

export type EdgeKind = "emotional" | "historical" | "genre" | "influence";

export interface Edge {
  fromId: string;
  toId: string;
  kind: EdgeKind;
  /** 0-1, used to drive opacity/thickness */
  strength: number;
}

/* ─── Similarity helpers ────────────────────────────── */

const EMOTION_KEYS: (keyof EmotionScores)[] = [
  "surrender",
  "defiance",
  "grief",
  "hope",
  "exhaustion",
  "transcendence",
];

function emotionDistance(a: EmotionScores, b: EmotionScores): number {
  let sum = 0;
  for (const k of EMOTION_KEYS) {
    const d = (a[k] ?? 0) - (b[k] ?? 0);
    sum += d * d;
  }
  // Max possible distance is sqrt(6); normalize to 0-1
  return Math.sqrt(sum) / Math.sqrt(EMOTION_KEYS.length);
}

function genreSimilarity(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  // Loose token overlap (e.g. "rock" inside "stadium rock")
  const ta = new Set(na.split(/[\s\-/]+/));
  const tb = new Set(nb.split(/[\s\-/]+/));
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.max(ta.size, tb.size);
}

function yearProximity(a: number, b: number): number {
  // 0 years apart → 1.0, ≥10 years apart → 0
  const diff = Math.abs(a - b);
  if (diff >= 10) return 0;
  return 1 - diff / 10;
}

function influenceSimilarity(a: CoverNode, b: CoverNode): number {
  const tA = a.era_tension ?? 0.5;
  const tB = b.era_tension ?? 0.5;
  const cA = a.political_charge ?? 0.5;
  const cB = b.political_charge ?? 0.5;
  const dt = Math.abs(tA - tB);
  const dc = Math.abs(cA - cB);
  const distance = Math.sqrt(dt * dt + dc * dc) / Math.SQRT2;
  return 1 - distance;
}

/* ─── Edge generation ───────────────────────────────── */

interface BuildOptions {
  /** Cap on how many edges of EACH kind any one node can carry. */
  maxEdgesPerKindPerNode?: number;
  /** Minimum strength for an edge to be kept. */
  minStrength?: number;
}

interface CandidateEdge extends Edge {
  // Use a stable ordering key to dedupe undirected pairs
  key: string;
}

export function buildRelationships(
  covers: CoverNode[],
  options: BuildOptions = {},
): Edge[] {
  const maxPerKind = options.maxEdgesPerKindPerNode ?? 2;
  const minStrength = options.minStrength ?? 0.6;

  if (covers.length < 2) return [];

  const candidates: CandidateEdge[] = [];

  for (let i = 0; i < covers.length; i++) {
    for (let j = i + 1; j < covers.length; j++) {
      const a = covers[i];
      const b = covers[j];
      const key = a.id < b.id ? `${a.id}::${b.id}` : `${b.id}::${a.id}`;

      // Emotional — distance inverted
      if (a.emotion_scores && b.emotion_scores) {
        const dist = emotionDistance(a.emotion_scores, b.emotion_scores);
        const strength = 1 - dist;
        if (strength >= minStrength) {
          candidates.push({
            key,
            fromId: a.id,
            toId: b.id,
            kind: "emotional",
            strength,
          });
        }
      }

      // Historical — only close years (≤5 yrs apart)
      const yp = yearProximity(a.year, b.year);
      if (yp >= 0.5) {
        candidates.push({
          key,
          fromId: a.id,
          toId: b.id,
          kind: "historical",
          strength: yp,
        });
      }

      // Genre — token overlap
      const gs = genreSimilarity(a.genre, b.genre);
      if (gs >= 0.5) {
        candidates.push({
          key,
          fromId: a.id,
          toId: b.id,
          kind: "genre",
          strength: gs,
        });
      }

      // Influence — era_tension + political_charge proximity, OR
      // any non-original cover linked back to the original (Dylan).
      const inf = influenceSimilarity(a, b);
      if (inf >= 0.7) {
        candidates.push({
          key,
          fromId: a.id,
          toId: b.id,
          kind: "influence",
          strength: inf,
        });
      }
      if (a.is_original !== b.is_original) {
        // Pull every cover toward the origin with a soft-strength influence edge.
        candidates.push({
          key,
          fromId: a.is_original ? a.id : b.id,
          toId: a.is_original ? b.id : a.id,
          kind: "influence",
          strength: 0.55,
        });
      }
    }
  }

  // Cap per-node-per-kind. Process by descending strength so the
  // strongest edges win.
  const sorted = [...candidates].sort((x, y) => y.strength - x.strength);
  const perNodeKindCount = new Map<string, number>();
  const accepted: Edge[] = [];
  const seen = new Set<string>();

  const bump = (id: string, kind: EdgeKind): number => {
    const k = `${id}::${kind}`;
    const next = (perNodeKindCount.get(k) ?? 0) + 1;
    perNodeKindCount.set(k, next);
    return next;
  };
  const peek = (id: string, kind: EdgeKind): number =>
    perNodeKindCount.get(`${id}::${kind}`) ?? 0;

  for (const cand of sorted) {
    const dedupeKey = `${cand.key}::${cand.kind}`;
    if (seen.has(dedupeKey)) continue;
    if (peek(cand.fromId, cand.kind) >= maxPerKind) continue;
    if (peek(cand.toId, cand.kind) >= maxPerKind) continue;
    seen.add(dedupeKey);
    bump(cand.fromId, cand.kind);
    bump(cand.toId, cand.kind);
    accepted.push({
      fromId: cand.fromId,
      toId: cand.toId,
      kind: cand.kind,
      strength: cand.strength,
    });
  }

  return accepted;
}

/** Filter edges by the active relationship mode.
 *
 * In "all" mode we keep only the strongest edge per pair, so the graph stays
 * legible. In a single-kind mode we return every edge of that kind.
 */
export function filterEdges(edges: Edge[], mode: RelationshipMode): Edge[] {
  if (mode !== "all") return edges.filter((e) => e.kind === mode);

  const bestByPair = new Map<string, Edge>();
  for (const e of edges) {
    const key = e.fromId < e.toId ? `${e.fromId}::${e.toId}` : `${e.toId}::${e.fromId}`;
    const existing = bestByPair.get(key);
    if (!existing || e.strength > existing.strength) bestByPair.set(key, e);
  }
  return Array.from(bestByPair.values());
}

/** Set of cover ids that share any edge with the given id. */
export function getNeighborIds(edges: Edge[], id: string | null): Set<string> {
  const set = new Set<string>();
  if (!id) return set;
  for (const e of edges) {
    if (e.fromId === id) set.add(e.toId);
    else if (e.toId === id) set.add(e.fromId);
  }
  return set;
}

/* ─── Edge style ─────────────────────────────────────── */

export const EDGE_KIND_HEX: Record<EdgeKind, number> = {
  emotional: 0xe9c176, // amber
  historical: 0xe5e2e1, // off-white
  genre: 0x7b3224, // rust
  influence: 0xc5a059, // gold
};

export const EDGE_KIND_LABEL: Record<EdgeKind, string> = {
  emotional: "Emotional",
  historical: "Historical",
  genre: "Genre",
  influence: "Influence",
};
