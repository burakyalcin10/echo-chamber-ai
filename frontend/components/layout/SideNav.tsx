"use client";

import { type AppMode } from "@/lib/types";

interface SideNavProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  backendOnline: boolean;
}

const NAV_ITEMS: { mode: AppMode; icon: string; label: string }[] = [
  { mode: "explore", icon: "explore", label: "Explore" },
  { mode: "match", icon: "compare_arrows", label: "Match" },
  { mode: "compare", icon: "analytics", label: "Compare" },
  { mode: "voice", icon: "auto_awesome", label: "Era Voice" },
  { mode: "archive", icon: "inventory_2", label: "Archive" },
];

export default function SideNav({
  activeMode,
  onModeChange,
  backendOnline,
}: SideNavProps) {
  return (
    <nav className="fixed left-0 top-0 h-full w-20 border-r border-white/15 bg-black flex flex-col items-center py-8 z-50">
      {/* Brand */}
      <div className="font-serif italic text-primary text-lg border-b border-white/10 pb-4 mb-4 text-center w-full">
        <span className="block px-2">Echo</span>
        <span className="block px-2">Chamber</span>
      </div>

      {/* Nav Items */}
      <div className="flex-grow flex flex-col items-center gap-8 mt-4 w-full">
        {NAV_ITEMS.map(({ mode, icon, label }) => {
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              aria-label={label}
              onClick={() => onModeChange(mode)}
              className={`flex flex-col items-center gap-2 group w-full transition-all duration-300 ${
                isActive
                  ? "scale-95"
                  : "hover:text-on-surface"
              }`}
            >
              <span
                className={`material-symbols-outlined transition-all duration-300 ${
                  isActive
                    ? "text-primary drop-shadow-[0_0_8px_rgba(197,160,89,0.6)]"
                    : "text-stone-500 group-hover:text-stone-200"
                }`}
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {icon}
              </span>
              <span
                className={`font-serif uppercase tracking-widest text-[10px] transition-all duration-300 ${
                  isActive
                    ? "text-primary drop-shadow-[0_0_8px_rgba(197,160,89,0.6)]"
                    : "text-stone-500 group-hover:text-stone-200"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom: Settings + Status LED */}
      <div className="flex flex-col items-center gap-6 mb-4 w-full">
        <button
          aria-label="Settings"
          className="flex flex-col items-center gap-2 group w-full hover:text-stone-200 transition-colors duration-300"
        >
          <span className="material-symbols-outlined text-stone-500 group-hover:text-stone-200">
            settings
          </span>
        </button>
        <div className="relative group cursor-pointer">
          <span
            className={`material-symbols-outlined text-[16px] ${
              backendOnline
                ? "text-primary/50 group-hover:text-primary"
                : "text-error/50 group-hover:text-error animate-pulse"
            }`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lens
          </span>
          <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-surface-container-high px-2 py-1 rounded border border-white/10 text-data-mono text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {backendOnline ? "Backend Connected" : "Backend Offline"}
          </div>
        </div>
      </div>
    </nav>
  );
}
