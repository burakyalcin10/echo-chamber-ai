"use client";

import { useState } from "react";
import { Loader2, Radar, SendHorizontal, X, AlertCircle, Info } from "lucide-react";

interface MatchDockProps {
  onSubmit: (text: string) => void;
  loading: boolean;
  error: string | null;
  matchResult: {
    bridgeText: string;
    similarity: number;
    matchMethod: "embedding" | "keyword_fallback";
    bridgeSource: "llm" | "local_fallback";
    matchedArtist: string;
    matchedYear: number;
  } | null;
  onClose: () => void;
  onDismissError: () => void;
}

export default function MatchDock({
  onSubmit,
  loading,
  error,
  matchResult,
  onClose,
  onDismissError,
}: MatchDockProps) {
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError || error;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (!hasEnoughSignal(trimmed)) {
      setLocalError(
        "Biraz daha gerçek bir veda yaz. En az birkaç kelimeyle neyi bıraktığını anlat.",
      );
      return;
    }
    setLocalError(null);
    onSubmit(trimmed);
  };

  return (
    <div className="shrink-0 border-t border-white/10 bg-surface px-8 py-4 z-30">
      <div className="w-full max-w-2xl mx-auto relative">
        {/* Floating label */}
        <div className="flex items-baseline justify-between mb-2">
          <label
            className="block text-label-caps text-on-surface-variant"
            htmlFor="match-input"
          >
            MATCH MY FAREWELL
          </label>
          <span className="font-serif italic text-[11px] text-stone-500">
            Your words become a signal in the map.
          </span>
        </div>

        {/* Input row */}
        <div
          className={`flex items-end border-b pb-2 transition-colors ${
            shownError ? "border-error/60" : "border-white/20 focus-within:border-primary"
          }`}
        >
          <input
            id="match-input"
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (localError) setLocalError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Write the goodbye you are trying to understand…"
            className="bg-transparent border-none outline-none w-full font-serif text-body-lg text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 px-0"
            disabled={loading}
            aria-label="Farewell text"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            aria-label={loading ? "Matching" : "Submit"}
            className="text-primary hover:text-primary-fixed ml-4 disabled:opacity-30 transition-colors"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <SendHorizontal size={20} strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Error inline */}
        {shownError && (
          <div className="mt-3 flex items-start gap-2 bg-error-container/40 border border-error/40 rounded p-3">
            <AlertCircle
              size={14}
              strokeWidth={1.75}
              className="text-error mt-0.5 flex-shrink-0"
            />
            <div className="flex-1 text-[12px] text-error">{shownError}</div>
            <button
              onClick={() => {
                setLocalError(null);
                onDismissError();
              }}
              aria-label="Dismiss error"
              className="text-error/60 hover:text-error transition-colors"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Match result */}
        {matchResult && (
          <div className="mt-4 max-h-52 overflow-y-auto bg-surface-container-high/90 backdrop-blur ghost-border rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3 gap-3">
              <span className="text-label-caps text-[10px] text-tertiary flex items-center gap-1.5 min-w-0">
                <Radar size={12} strokeWidth={1.75} className="flex-shrink-0" />
                <span className="truncate">
                  Signal Match — {matchResult.matchedArtist} (
                  {matchResult.matchedYear})
                </span>
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-data-mono text-[10px] text-stone-400">
                  Similarity: {Math.round(matchResult.similarity * 100)}%
                </span>
                <button
                  onClick={onClose}
                  aria-label="Dismiss match"
                  className="text-stone-500 hover:text-on-surface transition-colors"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>
            </div>
            <p className="text-sm text-stone-300 italic border-l-2 border-tertiary pl-3 py-1 leading-relaxed">
              {matchResult.bridgeText}
            </p>
            <div className="mt-3 rounded border border-white/10 bg-black/20 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-label-caps text-[10px] text-primary">
                <Info size={12} strokeWidth={1.75} />
                Why this match?
              </div>
              <p className="text-[12px] leading-relaxed text-stone-400">
                {matchResult.matchMethod === "embedding"
                  ? `Your farewell was encoded with the same sentence-embedding model as the covers, then compared by cosine similarity. The LLM only writes the bridge text; it does not choose the match.`
                  : `The semantic index was unavailable, so the app used a keyword fallback over artist, genre, mood, and historical notes.`}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge>
                {matchResult.matchMethod === "embedding"
                  ? "Embedding match"
                  : "Keyword fallback"}
              </Badge>
              <Badge>
                {matchResult.bridgeSource === "llm"
                  ? "LLM bridge"
                  : "Local fallback bridge"}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] uppercase tracking-widest text-stone-400 bg-surface-container px-2 py-0.5 rounded ghost-border">
      {children}
    </span>
  );
}

function hasEnoughSignal(text: string): boolean {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[.,;:!?()[\]{}"'`]/g, ""))
    .filter(Boolean);
  const generic = new Set([
    "hi",
    "hello",
    "hey",
    "selam",
    "merhaba",
    "sa",
    "slm",
  ]);
  const meaningfulWords = words.filter((word) => !generic.has(word));
  return text.length >= 12 && meaningfulWords.length >= 3;
}
