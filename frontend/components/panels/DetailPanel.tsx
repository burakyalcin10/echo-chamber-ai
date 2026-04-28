"use client";

import type { CoverDetail } from "@/lib/types";
import { EMOTION_LABELS, EMOTION_COLORS } from "@/lib/constants";
import EmotionMeter from "./EmotionMeter";

interface DetailPanelProps {
  cover: CoverDetail | null;
  loading: boolean;
  onCompare: () => void;
  onVoice: () => void;
  onClose: () => void;
}

export default function DetailPanel({
  cover,
  loading,
  onCompare,
  onVoice,
  onClose,
}: DetailPanelProps) {
  if (!cover && !loading) return null;

  return (
    <aside className="w-full md:w-96 bg-surface border-l border-white/10 flex flex-col h-full overflow-y-auto z-20">
      {loading ? (
        <DetailSkeleton />
      ) : cover ? (
        <>
          {/* Header */}
          <div className="p-6 border-b border-white/10 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-500 hover:text-on-surface transition-colors"
              aria-label="Close panel"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="text-label-caps text-[10px] text-primary tracking-widest mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">
                {cover.is_original ? "stars" : "album"}
              </span>
              {cover.is_original ? "ORIGIN" : "COVER VERSION"}
            </div>

            <h2 className="text-h2 text-on-surface mb-1">{cover.artist}</h2>
            <p className="font-serif text-base text-on-surface-variant italic">
              &ldquo;Knockin&rsquo; on Heaven&rsquo;s Door&rdquo;
            </p>
            <div className="text-data-mono text-stone-400 mt-2">
              {cover.year} · {cover.genre} · {cover.album}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col gap-8 flex-grow">
            {/* Meaning Shift */}
            {cover.meaning_shift && (
              <div>
                <p className="text-body-lg text-stone-300 leading-relaxed">
                  {cover.meaning_shift}
                </p>
              </div>
            )}

            {/* Emotional Profile */}
            <div className="flex flex-col gap-4">
              <h3 className="text-label-caps text-stone-500 border-b border-white/10 pb-2">
                EMOTIONAL PROFILE
              </h3>
              {Object.entries(cover.emotion_scores).map(([key, value]) => (
                <EmotionMeter
                  key={key}
                  label={EMOTION_LABELS[key] || key}
                  value={value}
                  colorClass={EMOTION_COLORS[key] || "bg-primary"}
                />
              ))}
            </div>

            {/* Historical Pulse */}
            {cover.historical_pulse && (
              <div className="bg-surface-container-low p-4 rounded ghost-border">
                <div className="flex items-center gap-2 mb-2 text-stone-400">
                  <span className="material-symbols-outlined text-[16px]">
                    timeline
                  </span>
                  <h3 className="text-label-caps text-[10px]">
                    HISTORICAL PULSE
                  </h3>
                </div>
                <p className="text-sm text-stone-400 leading-relaxed">
                  {cover.historical_pulse}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto pt-4 flex gap-3">
              <button
                onClick={onCompare}
                className="flex-1 bg-transparent border border-white/20 text-on-surface text-label-caps text-[11px] py-3 rounded hover:bg-white/5 transition-colors text-center"
              >
                Compare
              </button>
              <button
                onClick={onVoice}
                className="flex-1 bg-transparent border border-white/20 text-on-surface text-label-caps text-[11px] py-3 rounded hover:bg-white/5 transition-colors text-center"
              >
                Era Voice
              </button>
            </div>
          </div>
        </>
      ) : null}
    </aside>
  );
}

function DetailSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-6 animate-pulse">
      <div className="h-3 w-24 bg-surface-container-high rounded" />
      <div className="h-8 w-48 bg-surface-container-high rounded" />
      <div className="h-4 w-64 bg-surface-container-high rounded" />
      <div className="mt-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-surface-container-high rounded" />
              <div className="h-3 w-8 bg-surface-container-high rounded" />
            </div>
            <div className="h-1 w-full bg-surface-container-high rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
