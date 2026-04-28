"use client";

import { useState } from "react";

interface MatchDockProps {
  onSubmit: (text: string) => void;
  loading: boolean;
  matchResult: {
    bridgeText: string;
    similarity: number;
    matchMethod: string;
    bridgeSource: string;
    matchedArtist: string;
    matchedYear: number;
  } | null;
  onClose: () => void;
}

export default function MatchDock({
  onSubmit,
  loading,
  matchResult,
  onClose,
}: MatchDockProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() && !loading) {
      onSubmit(text.trim());
    }
  };

  return (
    <div className="border-t border-white/10 bg-surface px-8 py-5 z-30">
      <div className="w-full max-w-2xl mx-auto relative">
        {/* Label */}
        <label
          className="block text-label-caps text-on-surface-variant mb-3"
          htmlFor="match-input"
        >
          MATCH MY FAREWELL
        </label>

        {/* Input row */}
        <div className="flex items-end border-b border-white/20 pb-2 focus-within:border-primary transition-colors">
          <input
            id="match-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Describe the feeling of an ending..."
            className="bg-transparent border-none outline-none w-full font-serif text-body-lg text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 px-0"
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="text-primary hover:text-primary-fixed ml-4 disabled:opacity-30 transition-colors"
          >
            <span className="material-symbols-outlined">
              {loading ? "hourglass_top" : "send"}
            </span>
          </button>
        </div>

        {/* Match result */}
        {matchResult && (
          <div className="mt-4 bg-surface-container-high/90 backdrop-blur ghost-border rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-caps text-[10px] text-tertiary flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">
                  radar
                </span>
                Signal Match — {matchResult.matchedArtist} ({matchResult.matchedYear})
              </span>
              <div className="flex items-center gap-3">
                <span className="text-data-mono text-[10px] text-stone-400">
                  Similarity: {Math.round(matchResult.similarity * 100)}%
                </span>
                <button
                  onClick={onClose}
                  className="text-stone-500 hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              </div>
            </div>
            <p className="text-sm text-stone-300 italic border-l-2 border-tertiary pl-3 py-1 leading-relaxed">
              {matchResult.bridgeText}
            </p>
            {matchResult.bridgeSource === "local_fallback" && (
              <span className="inline-block mt-2 text-[9px] text-stone-500 bg-surface-container px-2 py-0.5 rounded ghost-border">
                ⚙ local fallback
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
