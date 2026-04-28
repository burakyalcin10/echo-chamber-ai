"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
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
import SideNav from "@/components/layout/SideNav";
import TopBar from "@/components/layout/TopBar";
import DetailPanel from "@/components/panels/DetailPanel";
import MatchDock from "@/components/dock/MatchDock";

// Dynamic import for EchoMap (Three.js requires client-only)
const EchoMap = dynamic(() => import("@/components/graph/EchoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-grow flex items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-data-mono text-stone-500 text-sm">
          Loading Echo Map...
        </span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  // ─── Core state ─────────────────────────────────
  const [mode, setMode] = useState<AppMode>("explore");
  const [covers, setCovers] = useState<CoverNode[]>([]);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);
  const [coverDetail, setCoverDetail] = useState<CoverDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Decade filter
  const [decadeFilter, setDecadeFilter] = useState<string | null>(null);

  // Match
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Compare
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [compareCoverA, setCompareCoverA] = useState<string | null>(null);
  const [compareCoverB, setCompareCoverB] = useState<string | null>(null);

  // Voice
  const [voiceResult, setVoiceResult] = useState<VoiceResponse | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);

  // Backend status
  const [backendOnline, setBackendOnline] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  // ─── Initial load ───────────────────────────────
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
          err instanceof Error ? err.message : "Failed to load graph"
        );
      } finally {
        setGraphLoading(false);
      }
    }
    init();
  }, []);

  // ─── Filtered covers ───────────────────────────
  const filteredCovers = useMemo(() => {
    if (!decadeFilter) return covers;
    const decadeStart = parseInt(decadeFilter);
    return covers.filter(
      (c) => c.year >= decadeStart && c.year < decadeStart + 10
    );
  }, [covers, decadeFilter]);

  // ─── Cover selection ────────────────────────────
  const handleSelectCover = useCallback(
    async (cover: CoverNode) => {
      // In compare mode, handle second selection
      if (mode === "compare" && compareCoverA && !compareCoverB) {
        if (cover.id === compareCoverA) return; // Can't compare with self
        setCompareCoverB(cover.id);
        // Fire compare request
        try {
          const result = await postCompare({
            cover_id_a: compareCoverA,
            cover_id_b: cover.id,
          });
          setCompareResult(result);
        } catch (err) {
          console.error("Compare failed:", err);
        }
        return;
      }

      setSelectedCoverId(cover.id);
      setCoverDetail(null);
      setDetailLoading(true);

      try {
        const detail = await getCover(cover.id);
        setCoverDetail(detail);
      } catch (err) {
        console.error("Failed to load cover detail:", err);
      } finally {
        setDetailLoading(false);
      }
    },
    [mode, compareCoverA, compareCoverB]
  );

  // ─── Match submission ───────────────────────────
  const handleMatchSubmit = useCallback(async (text: string) => {
    setMatchLoading(true);
    try {
      const result = await postMatch({ user_text: text });
      setMatchResult(result);
    } catch (err) {
      console.error("Match failed:", err);
    } finally {
      setMatchLoading(false);
    }
  }, []);

  // ─── Compare initiation ─────────────────────────
  const handleCompare = useCallback(() => {
    if (!selectedCoverId) return;
    setMode("compare");
    setCompareCoverA(selectedCoverId);
    setCompareCoverB(null);
    setCompareResult(null);
  }, [selectedCoverId]);

  // ─── Voice request ──────────────────────────────
  const handleVoice = useCallback(async () => {
    if (!selectedCoverId) return;
    setMode("voice");
    setVoiceLoading(true);
    try {
      const result = await postVoice({ cover_id: selectedCoverId });
      setVoiceResult(result);
    } catch (err) {
      console.error("Voice failed:", err);
    } finally {
      setVoiceLoading(false);
    }
  }, [selectedCoverId]);

  // ─── Close handlers ─────────────────────────────
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
  }, []);

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
    if (newMode === "explore") {
      setCompareCoverA(null);
      setCompareCoverB(null);
      setCompareResult(null);
      setVoiceResult(null);
    }
  }, []);

  // ─── Page title based on mode ──────────────────
  const pageTitle = useMemo(() => {
    switch (mode) {
      case "explore":
        return "Explore the Echo Map";
      case "match":
        return "Match My Farewell";
      case "compare":
        return compareCoverA && !compareCoverB
          ? "Select second cover to compare..."
          : "Compare Analysis";
      case "voice":
        return "Era Voice";
      case "archive":
        return "Archive";
      default:
        return "Echo Chamber AI";
    }
  }, [mode, compareCoverA, compareCoverB]);

  // ─── Dimming logic ─────────────────────────────
  const isDimmedFn = useCallback(
    (cover: CoverNode) => {
      if (mode === "compare" && compareCoverA) {
        return cover.id !== compareCoverA && cover.id !== compareCoverB;
      }
      return false;
    },
    [mode, compareCoverA, compareCoverB]
  );

  // ─── Match result for graph ────────────────────
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

  // ─── Render ─────────────────────────────────────
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
        />

        <div className="flex-grow pt-12 relative flex">
          {/* Graph area */}
          <div className="flex-grow relative overflow-hidden">
            {graphLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-canvas">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-data-mono text-stone-500">
                    Connecting to Echo Chamber...
                  </span>
                </div>
              </div>
            ) : graphError ? (
              <div className="w-full h-full flex items-center justify-center bg-canvas">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                  <span className="material-symbols-outlined text-4xl text-stone-600">
                    cloud_off
                  </span>
                  <h2 className="text-h2 text-stone-400">
                    The galaxy is silent
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Cannot reach the backend. Make sure uvicorn is running on
                    port 8000.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 border border-primary/30 text-primary text-label-caps text-[11px] rounded hover:bg-primary/10 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <EchoMap
                covers={filteredCovers}
                selectedCoverId={selectedCoverId}
                compareCoverIds={[compareCoverA, compareCoverB]}
                matchResult={matchGraphData}
                onSelectCover={handleSelectCover}
                isDimmedFn={isDimmedFn}
              />
            )}

            {/* Compare hint banner */}
            {mode === "compare" && compareCoverA && !compareCoverB && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-surface-container-high/90 backdrop-blur ghost-border rounded px-4 py-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">
                  compare_arrows
                </span>
                <span className="text-data-mono text-sm text-stone-300">
                  Click a second cover to compare
                </span>
                <button
                  onClick={() => {
                    setMode("explore");
                    setCompareCoverA(null);
                  }}
                  className="text-stone-500 hover:text-on-surface transition-colors ml-2"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Right detail panel */}
          <DetailPanel
            cover={coverDetail}
            loading={detailLoading}
            onCompare={handleCompare}
            onVoice={handleVoice}
            onClose={handleCloseDetail}
          />
        </div>

        {/* Voice overlay */}
        {mode === "voice" && (voiceResult || voiceLoading) && (
          <VoiceOverlay
            result={voiceResult}
            loading={voiceLoading}
            onClose={() => {
              setMode("explore");
              setVoiceResult(null);
            }}
          />
        )}

        {/* Compare result overlay */}
        {compareResult && (
          <CompareOverlay
            result={compareResult}
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
          matchResult={matchDockResult}
          onClose={handleCloseMatch}
        />
      </main>
    </div>
  );
}

// ─── Voice Overlay ────────────────────────────────
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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container ghost-border rounded max-w-2xl w-full mx-8 p-8 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-500 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-data-mono text-stone-500">
              Channeling the era...
            </span>
          </div>
        ) : result ? (
          <>
            <div className="text-label-caps text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">
                auto_awesome
              </span>
              ERA VOICE — {result.year}
            </div>
            <h3 className="text-h2 text-on-surface mb-1">{result.artist}</h3>
            <p className="font-serif text-base text-on-surface-variant italic mb-6">
              &ldquo;Knockin&rsquo; on Heaven&rsquo;s Door&rdquo;
            </p>

            <blockquote className="font-serif text-body-lg text-stone-300 leading-relaxed border-l-2 border-primary pl-6 py-2">
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
                      className="text-[10px] text-stone-400 bg-surface-container-low px-2 py-1 rounded ghost-border"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.monologue_source === "local_fallback" && (
              <span className="inline-block mt-4 text-[9px] text-stone-500 bg-surface-container px-2 py-0.5 rounded ghost-border">
                ⚙ local fallback
              </span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Compare Overlay ──────────────────────────────
function CompareOverlay({
  result,
  coverA,
  coverB,
  onClose,
}: {
  result: CompareResponse;
  coverA?: CoverNode;
  coverB?: CoverNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container ghost-border rounded max-w-2xl w-full mx-8 p-8 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-500 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-label-caps text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">
            analytics
          </span>
          COMPARE ANALYSIS
        </div>

        {/* Cover names */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h3 className="text-h2 text-on-surface">
              {coverA?.artist ?? "Cover A"}
            </h3>
            <span className="text-data-mono text-stone-400">
              {result.key_year_a}
            </span>
          </div>
          <span className="text-primary text-2xl">→</span>
          <div>
            <h3 className="text-h2 text-on-surface">
              {coverB?.artist ?? "Cover B"}
            </h3>
            <span className="text-data-mono text-stone-400">
              {result.key_year_b}
            </span>
          </div>
        </div>

        {/* Shift direction */}
        <div className="text-label-caps text-[10px] text-secondary mb-4">
          SHIFT: {result.shift_direction}
        </div>

        {/* Analysis text */}
        <p className="font-serif text-body-lg text-stone-300 leading-relaxed mb-6">
          {result.analysis}
        </p>

        {result.analysis_source === "local_fallback" && (
          <span className="inline-block text-[9px] text-stone-500 bg-surface-container px-2 py-0.5 rounded ghost-border">
            ⚙ local fallback
          </span>
        )}
      </div>
    </div>
  );
}
