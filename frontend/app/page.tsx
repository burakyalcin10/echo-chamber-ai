"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import {
  X,
  CloudOff,
  ArrowLeftRight,
  Sparkles,
  BarChart3,
  AlertCircle,
  Loader2,
  Archive,
  Music2,
  Settings,
  Database,
  BrainCircuit,
  FileText,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import type {
  CoverNode,
  CoverDetail,
  MatchResponse,
  CompareResponse,
  VoiceResponse,
  HealthResponse,
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
import BackgroundSoundtrack from "@/components/audio/BackgroundSoundtrack";

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
  const [musicPlayerOpen, setMusicPlayerOpen] = useState(false);

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

  // System trace
  const [systemTraceOpen, setSystemTraceOpen] = useState(false);
  const [exhibitionOpen, setExhibitionOpen] = useState(false);
  const [exhibitionIndex, setExhibitionIndex] = useState(0);

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
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  // ─── Initial load ───────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const healthData = await getHealth();
        setHealth(healthData);
        setBackendOnline(true);
      } catch {
        setHealth(null);
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

  const exhibitionSequence = useMemo(() => {
    if (!covers.length) return [];
    const original = covers.find((cover) => cover.is_original);
    const rest = covers
      .filter((cover) => !cover.is_original)
      .sort((a, b) => a.year - b.year || a.artist.localeCompare(b.artist));
    return original ? [original, ...rest] : rest;
  }, [covers]);

  useEffect(() => {
    if (!exhibitionOpen || exhibitionSequence.length === 0) return;
    const timer = window.setInterval(() => {
      setExhibitionIndex((index) => (index + 1) % exhibitionSequence.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [exhibitionOpen, exhibitionSequence.length]);

  const exhibitionCover =
    exhibitionSequence.length > 0
      ? exhibitionSequence[exhibitionIndex % exhibitionSequence.length]
      : null;

  // Highlight set for search-matched IDs (when searching, all filtered = matched)
  const searchHighlightedIds = useMemo(() => {
    if (!search.trim()) return new Set<string>();
    return new Set(filteredCovers.map((c) => c.id));
  }, [search, filteredCovers]);

  const highlightedIds = useMemo(() => {
    if (exhibitionOpen && exhibitionCover) {
      return new Set(["dylan_1973", exhibitionCover.id]);
    }
    const set = new Set(searchHighlightedIds);
    if (matchResult) set.add(matchResult.matched_cover.id);
    return set;
  }, [searchHighlightedIds, matchResult, exhibitionOpen, exhibitionCover]);

  // ─── Cover selection ────────────────────────────────
  const loadCoverDetail = useCallback(
    async (coverId: string) => {
      setMusicPlayerOpen(false);
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
    setVoiceResult(null);
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
    setMusicPlayerOpen(false);
  }, []);

  const handleCloseMatch = useCallback(() => {
    setMatchResult(null);
    setMatchError(null);
    setMode("explore");
  }, []);

  const handleModeChange = useCallback(
    (newMode: AppMode) => {
      if (newMode === "voice") {
        if (selectedCoverId) {
          void handleVoice();
          return;
        }
        setMode("voice");
        setVoiceResult(null);
        pushToast("info", "Select a cover first, then Era Voice will open its RAG monologue.");
        return;
      }

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
    [handleVoice, pushToast, selectedCoverId],
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
        return selectedCoverId ? "Era Voice" : "Select a cover for Era Voice";
      case "archive":
        return "Archive";
      default:
        return "Echo Chamber AI";
    }
  }, [mode, compareCoverA, compareCoverB, selectedCoverId]);

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

  const overlayOpen = Boolean(
    (mode === "voice" && (voiceResult || voiceLoading)) ||
      compareResult ||
      compareLoading ||
      systemTraceOpen ||
      mode === "archive",
  );

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden">
      <SideNav
        activeMode={mode}
        onModeChange={handleModeChange}
        onSettings={() => setSystemTraceOpen(true)}
        backendOnline={backendOnline}
      />

      <main className="ml-20 min-w-0 flex-grow relative flex flex-col h-dvh min-h-0 overflow-hidden">
        {!exhibitionOpen && (
          <TopBar
            activePage={pageTitle}
            decadeFilter={decadeFilter}
            onDecadeChange={setDecadeFilter}
            search={search}
            onSearchChange={setSearch}
            relationshipMode={relationshipMode}
            onRelationshipModeChange={setRelationshipMode}
            soundtrackControl={
              <BackgroundSoundtrack
                disabled={musicPlayerOpen}
                className="hidden sm:block"
              />
            }
            onExhibition={() => {
              setMode("explore");
              setSystemTraceOpen(false);
              setCompareResult(null);
              setVoiceResult(null);
              setExhibitionIndex(0);
              setExhibitionOpen(true);
            }}
            visibleCount={filteredCovers.length}
            totalCount={covers.length}
          />
        )}

        <div className={`min-h-0 flex-1 relative flex ${exhibitionOpen ? "pt-0" : "pt-14"}`}>
          {/* Graph area */}
          <div className="min-w-0 min-h-0 flex-1 relative overflow-hidden">
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
                covers={exhibitionOpen ? covers : filteredCovers}
                highlightedIds={highlightedIds}
                selectedCoverId={
                  exhibitionOpen ? exhibitionCover?.id ?? null : selectedCoverId
                }
                compareCoverIds={[compareCoverA, compareCoverB]}
                matchResult={matchGraphData}
                relationshipMode={exhibitionOpen ? "all" : relationshipMode}
                onSelectCover={handleSelectCover}
                isDimmedFn={
                  exhibitionOpen
                    ? (cover) =>
                        Boolean(
                          exhibitionCover &&
                            cover.id !== exhibitionCover.id &&
                            cover.id !== "dylan_1973",
                        )
                    : isDimmedFn
                }
                suppressLabels={overlayOpen}
                exhibitionMode={exhibitionOpen}
              />
            )}

            {/* Guidance banners */}
            {!exhibitionOpen && !graphLoading && !graphError && backendOnline && (
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

            {mode === "archive" && !graphLoading && !graphError && backendOnline && (
              <ArchivePanel covers={filteredCovers} onSelectCover={handleSelectCover} />
            )}

            {exhibitionOpen && exhibitionCover && (
              <ExhibitionHud
                cover={exhibitionCover}
                index={exhibitionIndex}
                total={exhibitionSequence.length}
                soundtrackControl={
                  <BackgroundSoundtrack
                    disabled={musicPlayerOpen}
                    className="pointer-events-auto absolute right-16 top-5 hidden sm:block"
                  />
                }
                onClose={() => setExhibitionOpen(false)}
              />
            )}
          </div>

          {/* Detail panel */}
          {!exhibitionOpen && (
            <DetailPanel
              cover={coverDetail}
              loading={detailLoading}
              onCompare={handleCompare}
              onVoice={handleVoice}
              onClose={handleCloseDetail}
              playerOpen={musicPlayerOpen}
              onPlayerOpenChange={setMusicPlayerOpen}
            />
          )}
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

        {systemTraceOpen && (
          <SystemTraceOverlay
            health={health}
            covers={covers}
            lastMatch={matchResult}
            lastVoice={voiceResult}
            backendOnline={backendOnline}
            onClose={() => setSystemTraceOpen(false)}
          />
        )}

        {/* Match signal panel */}
        {!musicPlayerOpen &&
          !exhibitionOpen &&
          (mode === "match" || matchResult || matchLoading || matchError) && (
          <MatchDock
            onSubmit={handleMatchSubmit}
            loading={matchLoading}
            error={matchError}
            matchResult={matchDockResult}
            onClose={handleCloseMatch}
            onDismissError={() => setMatchError(null)}
          />
        )}

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

function ArchivePanel({
  covers,
  onSelectCover,
}: {
  covers: CoverNode[];
  onSelectCover: (cover: CoverNode) => void;
}) {
  const sorted = [...covers].sort(
    (a, b) => a.year - b.year || a.artist.localeCompare(b.artist),
  );

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-black/85 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-label-caps text-primary">
              <Archive size={15} strokeWidth={1.75} />
              Archive
            </div>
            <h2 className="mt-2 font-serif text-3xl text-on-surface">
              Cover index
            </h2>
          </div>
          <span className="text-data-mono text-[11px] uppercase tracking-widest text-stone-500">
            {sorted.length} visible records
          </span>
        </div>

        <div className="grid gap-2">
          {sorted.map((cover) => (
            <button
              key={cover.id}
              onClick={() => onSelectCover(cover)}
              className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border border-white/10 bg-surface-container-low/70 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-surface-container-high"
            >
              <span className="text-data-mono text-sm text-primary">
                {cover.year}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-serif text-lg text-on-surface">
                  {cover.artist}
                </span>
                <span className="mt-1 block truncate text-data-mono text-[10px] uppercase tracking-widest text-stone-500">
                  {cover.genre || "uncategorized"} / {dominantEmotion(cover)}
                </span>
              </span>
              <span className="flex items-center gap-3 text-data-mono text-[10px] uppercase tracking-widest text-stone-500">
                {cover.youtube_video_id && (
                  <span className="flex items-center gap-1 text-primary">
                    <Music2 size={12} strokeWidth={1.75} />
                    Player
                  </span>
                )}
                {cover.is_original ? "Origin" : "Cover"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function dominantEmotion(cover: CoverNode): string {
  const [key] = Object.entries(cover.emotion_scores).sort(
    (a, b) => b[1] - a[1],
  )[0] ?? ["unknown", 0];
  return key;
}

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

  if (mode === "voice" && !hasSelection) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-surface-container-high/90 backdrop-blur ghost-border rounded px-4 py-2 flex items-center gap-3 shadow-xl">
        <Sparkles size={14} className="text-primary" />
        <span className="text-data-mono text-sm text-stone-300">
          Choose a cover node to hear its era voice.
        </span>
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
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black p-6"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed top-5 right-5 z-[80] text-stone-400 hover:text-on-surface transition-colors"
      >
        <X size={24} strokeWidth={1.75} />
      </button>
      <div
        className="bg-surface-container shadow-2xl ghost-border rounded max-w-2xl w-full p-8 relative max-h-[80vh] overflow-y-auto"
      >

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
                  ARCHIVE SIGNALS
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.rag_sources_used.map((src, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setExpandedSource((current) =>
                          current === src ? null : src,
                        )
                      }
                      className="text-[10px] text-stone-300 bg-surface-container-low px-2 py-1 rounded ghost-border hover:border-primary/50 hover:text-primary transition-colors"
                      title={src}
                    >
                      {archiveSignalLabel(src)}
                    </button>
                  ))}
                </div>
                {expandedSource && (
                  <div className="mt-3 rounded border border-primary/20 bg-black/20 p-3">
                    <div className="text-label-caps text-[9px] text-primary mb-1">
                      {archiveSignalLabel(expandedSource)}
                    </div>
                    <p className="text-[12px] leading-relaxed text-stone-400">
                      {archiveSignalSummary(expandedSource)}
                    </p>
                  </div>
                )}
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

function SystemTraceOverlay({
  health,
  covers,
  lastMatch,
  lastVoice,
  backendOnline,
  onClose,
}: {
  health: HealthResponse | null;
  covers: CoverNode[];
  lastMatch: MatchResponse | null;
  lastVoice: VoiceResponse | null;
  backendOnline: boolean;
  onClose: () => void;
}) {
  const videoCount = covers.filter((cover) => cover.youtube_video_id).length;
  const officialVideoCount = covers.filter((cover) =>
    cover.music_source_kind?.includes("official"),
  ).length;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black p-6"
    >
      <button
        onClick={onClose}
        aria-label="Close system trace"
        className="fixed top-5 right-5 z-[80] text-stone-400 hover:text-on-surface transition-colors"
      >
        <X size={24} strokeWidth={1.75} />
      </button>
      <div
        className="bg-surface-container shadow-2xl ghost-border rounded max-w-3xl w-full p-7 relative max-h-[82vh] overflow-y-auto"
      >
        <div className="text-label-caps text-primary mb-2 flex items-center gap-2">
          <Settings size={14} strokeWidth={1.75} />
          SYSTEM TRACE
        </div>
        <h3 className="text-h2 text-on-surface mb-2">Echo Chamber Engine</h3>
        <p className="text-sm text-stone-400 leading-relaxed mb-6 max-w-2xl">
          This panel exposes the machinery behind the artwork: generation,
          retrieval, semantic matching, and the archive layer feeding the map.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <TraceRow
            icon={<CheckCircle2 size={15} strokeWidth={1.75} />}
            label="Backend"
            value={backendOnline ? "Connected" : "Offline"}
            ok={backendOnline}
          />
          <TraceRow
            icon={<BrainCircuit size={15} strokeWidth={1.75} />}
            label="LLM generation"
            value={
              health?.llm_configured
                ? `${health.llm_provider.toUpperCase()} configured`
                : "Local fallback"
            }
            ok={Boolean(health?.llm_configured)}
          />
          <TraceRow
            icon={<Database size={15} strokeWidth={1.75} />}
            label="Embedding + UMAP"
            value={
              health?.processed_covers_exists
                ? `${health.processed_cover_count} semantic nodes`
                : "Raw cover positions"
            }
            ok={Boolean(health?.processed_covers_exists)}
          />
          <TraceRow
            icon={<FileText size={15} strokeWidth={1.75} />}
            label="RAG archive"
            value={
              lastVoice?.rag_sources_used.length
                ? `${lastVoice.rag_sources_used.length} sources used last`
                : "Ready for Era Voice"
            }
            ok={Boolean(health?.processed_covers_exists)}
          />
          <TraceRow
            icon={<Music2 size={15} strokeWidth={1.75} />}
            label="Playback archive"
            value={`${videoCount}/${covers.length} videos, ${officialVideoCount} official`}
            ok={videoCount > 0}
          />
          <TraceRow
            icon={<ArrowLeftRight size={15} strokeWidth={1.75} />}
            label="Last match"
            value={
              lastMatch
                ? `${lastMatch.match_method.replace("_", " ")} · ${Math.round(
                    lastMatch.similarity_score * 100,
                  )}%`
                : "No user signal yet"
            }
            ok={Boolean(lastMatch)}
          />
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <h4 className="text-label-caps text-[10px] text-stone-500 mb-3">
            AI TECHNIQUES IN USE
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            <TechniqueNote
              title="LLM"
              text="Gemini/OpenAI writes compare analysis, bridge text, and Era Voice monologues."
            />
            <TechniqueNote
              title="Embeddings"
              text="SentenceTransformer turns covers and user text into vectors for semantic matching."
            />
            <TechniqueNote
              title="RAG"
              text="Historical archive chunks are retrieved before the AI speaks as an era."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExhibitionHud({
  cover,
  index,
  total,
  soundtrackControl,
  onClose,
}: {
  cover: CoverNode;
  index: number;
  total: number;
  soundtrackControl?: ReactNode;
  onClose: () => void;
}) {
  const strongestEmotion = dominantEmotion(cover);
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <div className="exhibition-scan absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      {soundtrackControl}
      <button
        onClick={onClose}
        aria-label="Close exhibition mode"
        className="pointer-events-auto absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded border border-white/15 bg-black/50 text-stone-300 backdrop-blur hover:border-primary/50 hover:text-primary transition-colors"
      >
        <X size={18} strokeWidth={1.75} />
      </button>
      <div className="absolute bottom-8 left-8 max-w-xl">
        <div className="mb-2 flex items-center gap-2 text-label-caps text-primary">
          <PlayCircle size={14} strokeWidth={1.75} />
          Exhibition Pulse {String((index % total) + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
        <h2 className="font-serif text-4xl leading-tight text-on-surface md:text-6xl">
          {cover.artist}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-data-mono text-[11px] uppercase tracking-widest text-stone-300">
          <span>{cover.year}</span>
          {cover.genre && <span>{cover.genre}</span>}
          <span>{cover.is_original ? "Origin" : "Cover"}</span>
          <span className="text-primary">{strongestEmotion}</span>
        </div>
      </div>
      <div className="absolute bottom-10 right-8 hidden max-w-xs text-right text-sm leading-relaxed text-stone-300 md:block">
        The map keeps rotating; each recording becomes the temporary center of the door.
      </div>
    </div>
  );
}
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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black p-6"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed top-5 right-5 z-[80] text-stone-400 hover:text-on-surface transition-colors"
      >
        <X size={24} strokeWidth={1.75} />
      </button>
      <div
        className="bg-surface-container shadow-2xl ghost-border rounded max-w-2xl w-full p-8 relative max-h-[80vh] overflow-y-auto"
      >

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

function TraceRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded border border-white/10 bg-black/20 p-3">
      <div className={ok ? "text-primary" : "text-stone-500"}>{icon}</div>
      <div className="min-w-0">
        <div className="text-label-caps text-[9px] text-stone-500">
          {label}
        </div>
        <div className="truncate text-sm text-stone-300">{value}</div>
      </div>
    </div>
  );
}

function TechniqueNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/20 p-3">
      <div className="text-label-caps text-[10px] text-primary mb-1">
        {title}
      </div>
      <p className="text-[12px] leading-relaxed text-stone-400">{text}</p>
    </div>
  );
}

function archiveSignalLabel(source: string): string {
  const labels: Record<string, string> = {
    "1973_world_events.txt": "1973 world pressure",
    "counterculture_and_dylan_1970s.txt": "post-60s counterculture",
    "dylan_nobel_and_songwriting.txt": "Dylan as songwriter",
    "pat_garrett_film_context.txt": "Pat Garrett film myth",
    "vietnam_and_returning_soldiers.txt": "Vietnam afterimage",
  };
  return labels[source] ?? source.replace(/\.[^.]+$/, "").replace(/_/g, " ");
}

function archiveSignalSummary(source: string): string {
  const summaries: Record<string, string> = {
    "1973_world_events.txt":
      "Places the song inside the Vietnam withdrawal, Watergate pressure, economic anxiety, and the exhausted public mood of 1973.",
    "counterculture_and_dylan_1970s.txt":
      "Frames Dylan after the sixties: not as a simple protest voice, but as a mythic witness to counterculture fatigue and reinvention.",
    "dylan_nobel_and_songwriting.txt":
      "Treats covers as living inheritance: the same lyric changes when a different body, era, genre, and audience carry it.",
    "pat_garrett_film_context.txt":
      "Returns the song to its Western origin, where badge, gun, mother, and door belong to a dying sheriff's threshold.",
    "vietnam_and_returning_soldiers.txt":
      "Adds the afterimage of war: soldiers returning, moral injury, public grief, and the desire to put the guns down.",
  };
  return summaries[source] ?? "A retrieved archive fragment used to ground the AI monologue in historical texture.";
}
