"use client";

import { useState } from "react";
import {
  AlertCircle,
  Info,
  Loader2,
  Radar,
  SendHorizontal,
  X,
} from "lucide-react";

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
    <aside className="absolute bottom-6 left-5 top-20 z-40 w-[min(380px,calc(100vw-7.5rem))] overflow-hidden border border-white/10 bg-surface/95 shadow-2xl backdrop-blur-md">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
          <div>
            <label
              className="block text-label-caps text-primary"
              htmlFor="match-input"
            >
              MATCH MY FAREWELL
            </label>
            <p className="mt-1 font-serif text-sm italic leading-snug text-stone-500">
              Your words become a signal in the map.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close match panel"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-white/10 text-stone-500 transition-colors hover:border-primary/50 hover:text-primary"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <div
            className={`rounded border bg-black/20 p-3 transition-colors ${
              shownError
                ? "border-error/60"
                : "border-white/15 focus-within:border-primary/60"
            }`}
          >
            <textarea
              id="match-input"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (localError) setLocalError(null);
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  handleSubmit();
                }
              }}
              placeholder="Write the goodbye you are trying to understand..."
              className="min-h-28 w-full resize-none bg-transparent font-serif text-base leading-relaxed text-on-surface outline-none placeholder:text-on-surface-variant/50"
              disabled={loading}
              aria-label="Farewell text"
            />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <span className="text-data-mono text-[10px] uppercase tracking-widest text-stone-500">
                Ctrl Enter
              </span>
              <button
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
                aria-label={loading ? "Matching" : "Submit"}
                className="flex items-center gap-2 rounded border border-primary/40 px-3 py-1.5 text-data-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary/10 disabled:opacity-30"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <SendHorizontal size={14} strokeWidth={1.75} />
                )}
                Send
              </button>
            </div>
          </div>

          {shownError && (
            <div className="mt-3 flex items-start gap-2 rounded border border-error/40 bg-error-container/40 p-3">
              <AlertCircle
                size={14}
                strokeWidth={1.75}
                className="mt-0.5 flex-shrink-0 text-error"
              />
              <div className="flex-1 text-[12px] text-error">{shownError}</div>
              <button
                onClick={() => {
                  setLocalError(null);
                  onDismissError();
                }}
                aria-label="Dismiss error"
                className="text-error/60 transition-colors hover:text-error"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          )}

          {matchResult ? (
            <div className="mt-4 rounded border border-tertiary/25 bg-surface-container-high/90 p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 text-label-caps text-[10px] text-tertiary">
                  <Radar
                    size={12}
                    strokeWidth={1.75}
                    className="flex-shrink-0"
                  />
                  <span className="truncate">
                    Signal Match - {matchResult.matchedArtist} (
                    {matchResult.matchedYear})
                  </span>
                </span>
                <span className="flex-shrink-0 text-data-mono text-[10px] text-stone-400">
                  {Math.round(matchResult.similarity * 100)}%
                </span>
              </div>
              <p className="border-l-2 border-tertiary py-1 pl-3 text-sm italic leading-relaxed text-stone-300">
                {matchResult.bridgeText}
              </p>
              <div className="mt-3 rounded border border-white/10 bg-black/20 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-label-caps text-[10px] text-primary">
                  <Info size={12} strokeWidth={1.75} />
                  Why this match?
                </div>
                <p className="text-[12px] leading-relaxed text-stone-400">
                  {matchResult.matchMethod === "embedding"
                    ? "Your farewell was encoded with the same sentence-embedding model as the covers, then compared by cosine similarity. The LLM only writes the bridge text; it does not choose the match."
                    : "The semantic index was unavailable, so the app used a keyword fallback over artist, genre, mood, and historical notes."}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
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
          ) : (
            <div className="mt-4 rounded border border-white/10 bg-black/20 p-4">
              <p className="font-serif text-base leading-relaxed text-stone-400">
                Write a real goodbye, fatigue, surrender, anger, hope, or
                whatever is sitting in the room. The map will pull the nearest
                cover into view.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-3 text-data-mono text-[10px] uppercase tracking-widest text-stone-500">
          32 versions / one signal
        </div>
      </div>
    </aside>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-white/10 bg-surface-container px-2 py-0.5 text-[9px] uppercase tracking-widest text-stone-400">
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
