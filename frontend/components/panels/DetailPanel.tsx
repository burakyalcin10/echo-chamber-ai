"use client";

import type { CSSProperties } from "react";
import {
  X,
  Star,
  Disc3,
  Activity,
  Compass,
} from "lucide-react";
import type { CoverDetail } from "@/lib/types";
import { EMOTION_LABELS, EMOTION_COLORS } from "@/lib/constants";
import EmotionMeter from "./EmotionMeter";
import BrandMark from "@/components/layout/BrandMark";

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
  return (
    <aside className="w-full md:w-96 flex-shrink-0 bg-surface border-l border-white/10 flex flex-col h-full min-h-0 overflow-y-auto overscroll-contain z-20">
      {loading ? (
        <DetailSkeleton />
      ) : cover ? (
        <CoverDetailBody
          cover={cover}
          onCompare={onCompare}
          onVoice={onVoice}
          onClose={onClose}
        />
      ) : (
        <EmptyState />
      )}
    </aside>
  );
}

/* ─── Empty state ───────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center gap-4 text-on-surface-variant">
      <div className="relative">
        <BrandMark size="lg" />
        <Compass
          size={18}
          strokeWidth={1.5}
          className="absolute -right-2 -bottom-2 text-primary drop-shadow-[0_0_8px_rgba(233,193,118,0.45)]"
        />
      </div>
      <h2 className="font-serif text-xl text-on-surface leading-tight">
        Select a cover to hear how the song changes shape.
      </h2>
      <p className="text-data-mono text-[11px] uppercase tracking-widest text-stone-500">
        32 verified versions / One song / One door
      </p>
      <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
        Click any node in the Echo Map to open its archive entry — emotional
        profile, historical pulse, and AI commentary.
      </p>
    </div>
  );
}

/* ─── Loaded body ───────────────────────────────────── */

function CoverDetailBody({
  cover,
  onCompare,
  onVoice,
  onClose,
}: {
  cover: CoverDetail;
  onCompare: () => void;
  onVoice: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <HeroHeader cover={cover} onClose={onClose} />

      <div className="p-6 flex flex-col gap-8 flex-grow min-h-0">
        {cover.meaning_shift && (
          <p className="text-body-lg text-stone-300 leading-relaxed">
            &ldquo;{cover.meaning_shift}&rdquo;
          </p>
        )}

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

        <SonicSignature cover={cover} />

        {cover.historical_pulse && (
          <div className="bg-surface-container-low p-4 rounded ghost-border">
            <div className="flex items-center gap-2 mb-2 text-stone-400">
              <Activity size={14} strokeWidth={1.75} />
              <h3 className="text-label-caps text-[10px]">HISTORICAL PULSE</h3>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              {cover.historical_pulse}
            </p>
          </div>
        )}

        <div className="mt-auto pt-4 flex gap-3">
          <button
            onClick={onCompare}
            className="flex-1 bg-transparent border border-white/20 text-on-surface text-label-caps text-[11px] py-3 rounded hover:bg-white/5 transition-colors text-center"
          >
            Compare
          </button>
          <button
            onClick={onVoice}
            className="flex-1 bg-primary text-on-primary text-label-caps text-[11px] py-3 rounded hover:bg-primary-fixed transition-colors text-center shadow-[0_0_15px_rgba(233,193,118,0.2)]"
          >
            Era Voice
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Hero band ─────────────────────────────────────── */

function HeroHeader({
  cover,
  onClose,
}: {
  cover: CoverDetail;
  onClose: () => void;
}) {
  const tension = cover.era_tension ?? 0.5;
  const charge = cover.political_charge ?? 0.5;
  const heroImageStyle = getHeroImageStyle(cover.id);
  const hueA = Math.round(40 - tension * 12);
  const hueB = Math.round(220 - charge * 80);
  const gradient = `linear-gradient(135deg,
      hsl(${hueA} 55% ${22 + tension * 14}%) 0%,
      hsl(${hueA - 10} 35% 12%) 45%,
      hsl(${hueB} 25% ${8 + charge * 6}%) 100%)`;

  return (
    <div className="h-48 relative w-full flex-shrink-0 overflow-hidden border-b border-white/10">
      <div className="absolute inset-0" style={{ background: gradient }} />
      {cover.artist_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.artist_image_url}
          alt=""
          className="absolute right-0 top-0 h-full w-[74%] object-cover opacity-70 grayscale-[12%] saturate-[0.9]"
          style={heroImageStyle}
          draggable={false}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--color-surface) 0%, rgba(19,19,19,0.92) 46%, rgba(19,19,19,0.18) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-surface" />
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-stone-300 hover:text-on-surface transition-colors z-10"
        aria-label="Close panel"
      >
        <X size={16} strokeWidth={1.75} />
      </button>

      <div className="absolute bottom-4 left-6 right-6 z-10">
        <div className="text-data-mono text-[10px] text-primary tracking-widest uppercase mb-1 flex items-center gap-1.5">
          {cover.is_original ? (
            <Star size={12} strokeWidth={1.75} fill="currentColor" />
          ) : (
            <Disc3 size={12} strokeWidth={1.75} />
          )}
          {cover.is_original ? "ORIGIN" : "COVER VERSION"}
        </div>
        <h2 className="text-h2 text-on-surface m-0 leading-none">
          {cover.artist}
        </h2>
        <p className="font-serif text-sm text-on-surface-variant italic mt-1">
          &ldquo;Knockin&rsquo; on Heaven&rsquo;s Door&rdquo;
        </p>
        <div className="text-data-mono text-stone-300 mt-2 text-[12px]">
          {cover.year}
          {cover.genre ? ` · ${cover.genre}` : ""}
          {cover.album ? ` · ${cover.album}` : ""}
        </div>
      </div>
    </div>
  );
}

function getHeroImageStyle(coverId: string): CSSProperties {
  if (coverId === "dylan_1973") {
    return {
      objectPosition: "55% 30%",
      transform: "scale(1.08)",
      transformOrigin: "65% 30%",
    };
  }

  return {
    objectPosition: "50% 32%",
    transform: "scale(1.04)",
    transformOrigin: "50% 35%",
  };
}

/* ─── Sonic signature ───────────────────────────────── */

function SonicSignature({ cover }: { cover: CoverDetail }) {
  const scores = Object.values(cover.emotion_scores);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

  const bars: { value: number; high: boolean }[] = [];
  for (let i = 0; i < scores.length; i++) {
    const a = scores[i];
    const b = scores[(i + 1) % scores.length];
    for (let k = 0; k < 3; k++) {
      const t = k / 3;
      const v = a * (1 - t) + b * t;
      bars.push({ value: v, high: v >= mean });
    }
  }

  return (
    <div className="border border-white/10 bg-surface-container-low p-4 rounded">
      <h4 className="text-label-caps text-[10px] text-on-surface mb-3">
        SONIC SIGNATURE
      </h4>
      <div className="h-12 w-full flex items-end gap-[2px]">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`w-1 rounded-sm ${
              bar.high ? "bg-primary" : "bg-secondary-container"
            }`}
            style={{ height: `${Math.max(8, Math.round(bar.value * 100))}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="h-48 bg-surface-container-high animate-pulse" />
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
    </>
  );
}
