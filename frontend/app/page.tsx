"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  X,
  CloudOff,
  ArrowLeftRight,
  Sparkles,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type {
  CoverNode,
  CoverDetail,
  MatchResponse,
  CompareResponse,
  VoiceResponse,
  AppMode,
} from "@/lib/types";
import {
  getHealth,
  getGraph,
  getCover,
  postMatch,
  postCompare,
  postVoice,
} from "@/lib/api";
import type { RelationshipMode } from "@/lib/relationships";
import SideNav from "@/components/layout/SideNav";
import TopBar from "@/components/layout/TopBar";
import DetailPanel from "@/components/panels/DetailPanel";
import MatchDock from "@/components/dock/MatchDock";

const EchoMap = dynamic(() => import("@/components/graph/EchoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-grow flex items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={28} className="text-primary animate-spin" />
        <span className="text-data-mono text-stone-500 text-sm">
          Loading Echo Map…
        </span>
      </div>
    </div>
  ),
});

interface Toast {
  id: number;
  kind: "error" | "info";
  text: string;
}

export default function HomePage() {
  // ─── State ──────────────────────────────────────────
  const [mode, setMode] = useState<AppMode>("explore");
  const [covers, setCovers] = useState<CoverNode[]>([]);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);
  const [coverDetail, setCoverDetail] = useState<CoverDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [decadeFilter, setDecadeFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [relationshipMode, setRelationshipMode] = useState<RelationshipMode>(
    "all",
  );

  // Match
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Compare
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(
    null,
  );
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareCoverA, setCompareCoverA] = useState<string | null>(null);
  const [compareCoverB, setCompareCoverB] = useState<string | null>(null);

  // Voice
  const [voiceResult, setVoiceResult] = useState<VoiceResponse | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 6000);
  }, []);

  // Backend status
  const [backendOnline, setBackendOnline] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  // ─── Initial load ───────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        await getHealth();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }

      try {
        setGraphLoading(true);
        const data = await getGraph();
        setCovers(data.covers);
        setGraphError(null);
      } catch (err) {
        setGraphError(
          err instanceof Error ? err.message : "Failed to load graph",
        );
      } finally {
        setGraphLoading(false);
      }
    }
    init();
  }, []);

  // ─── Filtering / search ─────────────────────────────
  const filteredCovers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return covers.filter((c) => {
      if (decadeFilter) {
        const start = parseInt(decadeFilter);
        if (!(c.year >= start && c.year < start + 10)) return false;
      }
      if (q) {
        const hay = `${c.artist} ${c.year}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [covers, decadeFilter, search]);

  // Highlight set for search-matched IDs (when searching, all filtered = matched)
  const searchHighlightedIds = useMemo(() => {
    if (!search.trim()) return new Set<string>();
    return new Set(filteredCovers.map((c) => c.id));
  }, [search, filteredCovers]);

  const highlightedIds = useMemo(() => {
    const set = new Set(searchHighlightedIds);
    if (matchResult) set.add(matchResult.matched_cover.id);
    return set;
  }, [searchHighlightedIds, matchResult]);

  // ─── Cover selection ────────────────────────────────
  const loadCoverDetail = useCallback(
    async (coverId: string) => {
      setSelectedCoverId(coverId);
      setCoverDetail(null);
      setDetailLoading(true);
      try {
        const detail = await getCover(coverId);
        setCoverDetail(detail);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load cover detail";
        pushToast("error", msg);
        setSelectedCoverId(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [pushToast],
  );

  const handleSelectCover = useCallback(
    async (cover: CoverNode) => {
      // Compare second-pick path
      if (mode === "compare" && compareCoverA && !compareCoverB) {
        if (cover.id === compareCoverA) return;
        setCompareCoverB(cover.id);
        setCompareLoading(true);
        try {
          const result = await postCompare({
            cover_id_a: compareCoverA,
            cover_id_b: cover.id,
          });
          setCompareResult(result);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Compare failed";
          pushToast("error", `Compare failed: ${msg}`);
          setCompareCoverB(null);
          setMode("explore");
        } finally {
          setCompareLoading(false);
        }
        return;
      }
      await loadCoverDetail(cover.id);
    },
    [mode, compareCoverA, compareCoverB, loadCoverDetail, pushToast],
  );

  // ─── Match submission ───────────────────────────────
  const handleMatchSubmit = useCallback(
    async (text: string) => {
      setMatchLoading(true);
      setMatchError(null);
      try {
        const result = await postMatch({ user_text: text });
        setMatchResult(result);
        // Auto-open the matched cover in the detail panel
        await loadCoverDetail(result.matched_cover.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Match failed";
        setMatchError(msg);
        pushToast("error", `Match failed: ${msg}`);
      } finally {
        setMatchLoading(false);
      }
    },
    [loadCoverDetail, pushToast],
  );

  // ─── Compare initiation ─────────────────────────────
  const handleCompare = useCallback(() => {
    if (!selectedCoverId) return;
    setMode("compare");
    setCompareCoverA(selectedCoverId);
    setCompareCoverB(null);
    setCompareResult(null);
  }, [selectedCoverId]);

  // ─── Voice request ──────────────────────────────────
  const handleVoice = useCallback(async () => {
    if (!selectedCoverId) return;
    setMode("voice");
    setVoiceLoading(true);
    try {
      const result = await postVoice({ cover_id: selectedCoverId });
      setVoiceResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Voice failed";
      pushToast("error", `Era Voice failed: ${msg}`);
      setMode("explore");
    } finally {
      setVoiceLoading(false);
    }
  }, [selectedCoverId, pushToast]);

  // ─── Close handlers ─────────────────────────────────
  const handleCloseDetail = useCallback(() => {
    setSelectedCoverId(null);
    setCoverDetail(null);
    setMode("explore");
    setCompareCoverA(null);
    setCompareCoverB(null);
    setCompareResult(null);
    setVoiceResult(null);
  }, []);

  const handleCloseMatch = useCallback(() => {
    setMatchResult(null);
    setMatchError(null);
  }, []);

  const handleModeChange = useCallback(
    (newMode: AppMode) => {
      setMode(newMode);
      if (newMode === "compare" && selectedCoverId) {
        setCompareCoverA(selectedCoverId);
        setCompareCoverB(null);
        setCompareResult(null);
      }
      if (newMode === "explore") {
        setCompareCoverA(null);
        setCompareCoverB(null);
        setCompareResult(null);
        setVoiceResult(null);
      }
    },
    [selectedCoverId],
  );

  // ─── Page title ─────────────────────────────────────
  const pageTitle = useMemo(() => {
    switch (mode) {
      case "explore":
        return "Explore the Echo Map";
      case "match":
        return "Match My Farewell";
      case "compare":
        return compareCoverA && !compareCoverB
          ? "Choose a second cover…"
          : "Compare Analysis";
      case "voice":
        return "Era Voice";
      case "archive":
        return "Archive";
      default:
        return "Echo Chamber AI";
    }
  }, [mode, compareCoverA, compareCoverB]);

  // ─── Dimming ───────────────────────────────────────
  const isDimmedFn = useCallback(
    (cover: CoverNode) => {
      if (mode === "compare" && compareCoverA) {
        return cover.id !== compareCoverA && cover.id !== compareCoverB;
      }
      // While searching, dim non-matches
      if (search.trim() && !searchHighlightedIds.has(cover.id)) return true;
      return false;
    },
    [mode, compareCoverA, compareCoverB, search, searchHighlightedIds],
  );

  // ─── Match result for graph ─────────────────────────
  const matchGraphData = useMemo(() => {
    if (!matchResult) return null;
    return {
      userPosition: matchResult.user_position,
      matchedCoverId: matchResult.matched_cover.id,
    };
  }, [matchResult]);

  const matchDockResult = useMemo(() => {
    if (!matchResult) return null;
    return {
      bridgeText: matchResult.bridge_text,
      similarity: matchResult.similarity_score,
      matchMethod: matchResult.match_method,
      bridgeSource: matchResult.bridge_source,
      matchedArtist: matchResult.matched_cover.artist,
      matchedYear: matchResult.matched_cover.year,
    };
  }, [matchResult]);

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      <SideNav
        activeMode={mode}
        onModeChange={handleModeChange}
        backendOnline={backendOnline}
      />

      <main className="ml-20 flex-grow relative flex flex-col h-screen">
        <TopBar
          activePage={pageTitle}
          decadeFilter={decadeFilter}
          onDecadeChange={setDecadeFilter}
          search={search}
          onSearchChange={setSearch}
          relationshipMode={relationshipMode}
          onRelationshipModeChange={setRelationshipMode}
          visibleCount={filteredCovers.length}
          totalCount={covers.length}
        />

        <div className="flex-grow pt-14 relative flex">
          {/* Graph area */}
          <div className="flex-grow relative overflow-hidden">
            {graphLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-canvas">
                <div className="flex flex-col items-center gap-4">
                  <Loader2
                    size={36}
                    className="text-primary animate-spin"
                  />
                  <span className="text-data-mono text-stone-500">
                    Connecting to Echo Chamber…
                  </span>
                </div>
              </div>
            ) : graphError || !backendOnline ? (
              <BackendOffline onRetry={() => window.location.reload()} />
            ) : (
              <EchoMap
                covers={filteredCovers}
                highlightedIds={highlightedIds}
                selectedCoverId={selectedCoverId}
                compareCoverIds={[compareCoverA, compareCoverB]}
                matchResult={matchGraphData}
                relationshipMode={relationshipMode}
                onSelectCover={handleSelectCover}
                isDimmedFn={isDimmedFn}
              />
            )}

            {/* Guidance banners */}
            {!graphLoading && !graphError && backendOnline && (
              <GuidanceBanner
                mode={mode}
                hasSelection={!!selectedCoverId}
                compareStep={
                  mode === "compare" && compareCoverA && !compareCoverB
                    ? "second"
                    : compareResult
                      ? "result"
                      : "first"
                }
                onCancelCompare={() => {
                  setMode("explore");
                  setCompareCoverA(null);
                  setCompareCoverB(null);
                }}
              />
            )}
          </div>

          {/* Detail panel */}
          <DetailPanel
            cover={coverDetail}
            loading={detailLoading}
            onCompare={handleCompare}
            onVoice={handleVoice}
            onClose={handleCloseDetail}
          />
        </div>

        {/* Voice overlay */}
        {(voiceResult || voiceLoading) && mode === "voice" && (
          <VoiceOverlay
            result={voiceResult}
            loading={voiceLoading}
            onClose={() => {
              setMode("explore");
              setVoiceResult(null);
            }}
          />
        )}

        {/* Compare overlay */}
        {(compareResult || compareLoading) && (
          <CompareOverlay
            result={compareResult}
            loading={compareLoading}
            coverA={covers.find((c) => c.id === compareCoverA)}
            coverB={covers.find((c) => c.id === compareCoverB)}
            onClose={() => {
              setMode("explore");
              setCompareResult(null);
              setCompareCoverA(null);
              setCompareCoverB(null);
            }}
          />
        )}

        {/* Bottom match dock */}
        <MatchDock
          onSubmit={handleMatchSubmit}
          loading={matchLoading}
          error={matchError}
          matchResult={matchDockResult}
          onClose={handleCloseMatch}
          onDismissError={() => setMatchError(null)}
        />

        {/* Toasts */}
        {toasts.length > 0 && (
          <div className="fixed top-20 right-6 z-[60] flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`flex items-start gap-2 rounded ghost-border p-3 shadow-2xl backdrop-blur ${
                  t.kind === "error"
                    ? "bg-error-container/30 border-error/40"
                    : "bg-surface-container/90"
                }`}
              >
                <AlertCircle
                  size={14}
                  strokeWidth={1.75}
                  className={
                    t.kind === "error"
                      ? "text-error mt-0.5"
                      : "text-primary mt-0.5"
                  }
                />
                <span
                  className={`text-[12px] flex-1 leading-relaxed ${
                    t.kind === "error" ? "text-error" : "text-on-surface-variant"
                  }`}
                >
                  {t.text}
                </span>
                <button
                  aria-label="Dismiss"
                  onClick={() =>
                    setToasts((arr) => arr.filter((x) => x.id !== t.id))
                  }
                  className="text-stone-500 hover:text-on-surface transition-colors"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Guidance banner ─────────────────────────────── */

function GuidanceBanner({
  mode,
  hasSelection,
  compareStep,
  onCancelCompare,
}: {
  mode: AppMode;
  hasSelection: boolean;
  compareStep: "first" | "second" | "result";
  onCancelCompare: () => void;
}) {
  if (mode === "compare" && compareStep === "second") {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-surface-container-high/90 backdrop-blur ghost-border rounded px-4 py-2 flex items-center gap-3 shadow-xl">
        <ArrowLeftRight size={14} className="text-primary" />
        <span className="text-data-mono text-sm text-stone-300">
          Now choose a second cover.
        </span>
        <button
          onClick={onCancelCompare}
          aria-label="Cancel compare"
          className="text-stone-500 hover:text-on-surface transition-colors ml-2"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  if (mode === "explore" && !hasSelection) {
    return (
      <div className="absolute bottom-6 left-6 z-20 bg-surface-container/70 backdrop-blur ghost-border rounded px-3 py-2 text-data-mono text-[11px] text-stone-400 max-w-xs">
        Select a node to open its archive entry.
      </div>
    );
  }

  return null;
}

/* ─── Backend offline ─────────────────────────────── */

function BackendOffline({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-8">
        <CloudOff size={36} className="text-stone-600" strokeWidth={1.5} />
        <h2 className="text-h2 text-stone-400">The galaxy is silent</h2>
        <p className="text-sm text-stone-500 leading-relaxed">
          Cannot reach the backend. Make sure
          <code className="text-on-surface-variant">
            {" "}
            uvicorn main:app --reload --port 8000{" "}
          </code>
          is running, then retry.
        </p>
        <button
          onClick={onRetry}
          className="mt-2 px-6 py-2 border border-primary/30 text-primary text-label-caps text-[11px] rounded hover:bg-primary/10 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/* ─── Voice overlay ───────────────────────────────── */

function VoiceOverlay({
  result,
  loading,
  onClose,
}: {
  result: VoiceResponse | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-surface-container ghost-border rounded max-w-2xl w-full p-8 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-stone-500 hover:text-on-surface transition-colors"
        >
          <X size={18} strokeWidth={1.75} />
        </button>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 size={28} className="text-primary animate-spin" />
            <span className="text-data-mono text-stone-500">
              Channeling the era…
            </span>
          </div>
        ) : result ? (
          <>
            <div className="text-label-caps text-primary mb-2 flex items-center gap-2">
              <Sparkles size={14} strokeWidth={1.75} />
              ERA VOICE — {result.year}
            </div>
            <h3 className="text-h2 text-on-surface mb-1">{result.artist}</h3>
            <p className="font-serif text-base text-on-surface-variant italic mb-6">
              &ldquo;Knockin&rsquo; on Heaven&rsquo;s Door&rdquo;
            </p>

            <blockquote className="font-serif text-body-lg text-stone-300 leading-relaxed border-l-2 border-primary pl-6 py-2 whitespace-pre-line">
              {result.monologue}
            </blockquote>

            {result.rag_sources_used.length > 0 && (
              <div className="mt-6">
                <h4 className="text-label-caps text-[10px] text-stone-500 mb-2">
                  RAG SOURCES
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.rag_sources_used.map((src, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-stone-300 bg-surface-container-low px-2 py-1 rounded ghost-border"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <SourceBadge source={result.monologue_source} kind="monologue" />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Compare overlay ─────────────────────────────── */

function CompareOverlay({
  result,
  loading,
  coverA,
  coverB,
  onClose,
}: {
  result: CompareResponse | null;
  loading: boolean;
  coverA?: CoverNode;
  coverB?: CoverNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-surface-container ghost-border rounded max-w-2xl w-full p-8 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-stone-500 hover:text-on-surface transition-colors"
        >
          <X size={18} strokeWidth={1.75} />
        </button>

        <div className="text-label-caps text-primary mb-4 flex items-center gap-2">
          <BarChart3 size={14} strokeWidth={1.75} />
          COMPARE ANALYSIS
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 size={28} className="text-primary animate-spin" />
            <span className="text-data-mono text-stone-500">
              Reading the meaning shift…
            </span>
          </div>
        ) : result ? (
          <>
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div>
                <h3 className="text-h2 text-on-surface">
                  {coverA?.artist ?? "Cover A"}
                </h3>
                <span className="text-data-mono text-stone-400">
                  {result.key_year_a}
                </span>
              </div>
              <ArrowLeftRight size={20} className="text-primary" />
              <div>
                <h3 className="text-h2 text-on-surface">
                  {coverB?.artist ?? "Cover B"}
                </h3>
                <span className="text-data-mono text-stone-400">
                  {result.key_year_b}
                </span>
              </div>
            </div>

            <div className="text-label-caps text-[10px] text-secondary-container mb-4">
              SHIFT · {result.shift_direction.replace("->", " → ")}
            </div>

            <p className="font-serif text-body-lg text-stone-300 leading-relaxed mb-6 whitespace-pre-line">
              {result.analysis}
            </p>

            <SourceBadge source={result.analysis_source} kind="analysis" />
          </>
        ) : null}
      </div>
    </div>
  );
}

function SourceBadge({
  source,
  kind,
}: {
  source: "llm" | "local_fallback";
  kind: string;
}) {
  return (
    <span
      className={`inline-block text-[9px] uppercase tracking-widest px-2 py-0.5 rounded ghost-border ${
        source === "llm"
          ? "text-primary bg-primary/10"
          : "text-stone-400 bg-surface-container"
      }`}
    >
      {source === "llm" ? `LLM ${kind}` : `Local fallback ${kind}`}
    </span>
  );
}
