"use client";

import {
  Compass,
  ArrowLeftRight,
  BarChart3,
  Sparkles,
  Archive as ArchiveIcon,
  Settings,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { type AppMode } from "@/lib/types";

interface SideNavProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onSettings: () => void;
  backendOnline: boolean;
}

const NAV_ITEMS: { mode: AppMode; Icon: LucideIcon; label: string }[] = [
  { mode: "explore", Icon: Compass, label: "Explore" },
  { mode: "match", Icon: ArrowLeftRight, label: "Match" },
  { mode: "compare", Icon: BarChart3, label: "Compare" },
  { mode: "voice", Icon: Sparkles, label: "Era Voice" },
  { mode: "archive", Icon: ArchiveIcon, label: "Archive" },
];

export default function SideNav({
  activeMode,
  onModeChange,
  onSettings,
  backendOnline,
}: SideNavProps) {
  return (
    <nav className="fixed left-0 top-0 h-full w-20 border-r border-white/15 bg-black flex flex-col items-center py-8 z-50">
      {/* Brand */}
      <div className="font-serif italic text-primary text-lg border-b border-white/10 pb-4 mb-4 text-center w-full">
        <span className="block px-2">Echo</span>
        <span className="block px-2">Chamber</span>
      </div>

      {/* Nav items */}
      <div className="flex-grow flex flex-col items-center gap-7 mt-4 w-full">
        {NAV_ITEMS.map(({ mode, Icon, label }) => {
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onModeChange(mode)}
              className={`flex flex-col items-center gap-1.5 group w-full transition-all duration-300 ${
                isActive ? "scale-95" : ""
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.25 : 1.5}
                className={`transition-all duration-300 ${
                  isActive
                    ? "text-primary drop-shadow-[0_0_8px_rgba(197,160,89,0.6)]"
                    : "text-stone-500 group-hover:text-stone-200"
                }`}
              />
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

      {/* Bottom: Settings + status LED */}
      <div className="flex flex-col items-center gap-6 mb-4 w-full">
        <button
          aria-label="Settings"
          onClick={onSettings}
          className="flex flex-col items-center text-stone-500 hover:text-stone-200 transition-colors duration-300"
        >
          <Settings size={18} strokeWidth={1.5} />
        </button>
        <div className="relative group cursor-default">
          <Circle
            size={10}
            fill="currentColor"
            strokeWidth={0}
            className={
              backendOnline
                ? "text-primary/70 group-hover:text-primary"
                : "text-error/70 animate-pulse"
            }
          />
          <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-surface-container-high px-2 py-1 rounded border border-white/10 text-data-mono text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {backendOnline ? "Backend Connected" : "Backend Offline"}
          </div>
        </div>
      </div>
    </nav>
  );
}
