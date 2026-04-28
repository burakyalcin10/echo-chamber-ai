"use client";

import { DECADES, type Decade } from "@/lib/constants";

interface TopBarProps {
  activePage: string;
  decadeFilter: string | null;
  onDecadeChange: (decade: string | null) => void;
}

export default function TopBar({
  activePage,
  decadeFilter,
  onDecadeChange,
}: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-5rem)] h-12 border-b border-white/10 bg-black/80 backdrop-blur-md flex justify-between items-center px-8 z-40">
      {/* Left: Page title */}
      <div className="font-serif text-sm tracking-tight text-on-surface">
        {activePage}
      </div>

      {/* Right: Decade filters + controls */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-4">
          {DECADES.map((decade: Decade) => {
            const isActive = decadeFilter === decade;
            return (
              <button
                key={decade}
                onClick={() =>
                  onDecadeChange(isActive ? null : decade)
                }
                className={`font-serif text-sm tracking-tight transition-colors ${
                  isActive
                    ? "text-primary border-b border-primary opacity-80"
                    : "text-stone-400 hover:text-primary/70"
                }`}
              >
                {decade}
              </button>
            );
          })}
        </nav>

        <div className="h-4 w-px bg-white/15 mx-2 hidden md:block" />

        <div className="flex items-center gap-4">
          <button className="text-stone-400 hover:text-primary/70 transition-colors flex items-center">
            <span className="material-symbols-outlined text-sm">
              filter_list
            </span>
          </button>
          <button className="text-stone-400 hover:text-primary/70 transition-colors flex items-center">
            <span className="material-symbols-outlined text-sm">
              history_edu
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
