"use client";

import { PlayCircle, Search, X, SlidersHorizontal } from "lucide-react";
import { DECADES, type Decade } from "@/lib/constants";
import {
  type RelationshipMode,
  EDGE_KIND_LABEL,
  type EdgeKind,
} from "@/lib/relationships";
import BrandMark from "./BrandMark";

interface TopBarProps {
  activePage: string;
  decadeFilter: string | null;
  onDecadeChange: (decade: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  relationshipMode: RelationshipMode;
  onRelationshipModeChange: (mode: RelationshipMode) => void;
  onExhibition: () => void;
  visibleCount: number;
  totalCount: number;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipMode; label: string }[] = [
  { value: "all", label: "All" },
  ...(["emotional", "historical", "genre", "influence"] as EdgeKind[]).map(
    (k) => ({ value: k, label: EDGE_KIND_LABEL[k] }),
  ),
];

export default function TopBar({
  activePage,
  decadeFilter,
  onDecadeChange,
  search,
  onSearchChange,
  relationshipMode,
  onRelationshipModeChange,
  onExhibition,
  visibleCount,
  totalCount,
}: TopBarProps) {
  const filtersActive = !!decadeFilter || search.trim().length > 0;

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-5rem)] h-14 border-b border-white/10 bg-black/80 backdrop-blur-md flex justify-between items-center px-6 z-40 gap-4">
      {/* Left: page title + search */}
      <div className="flex items-center gap-4 min-w-0 flex-shrink">
        <div className="flex items-center gap-2 min-w-0">
          <BrandMark size="sm" className="hidden sm:inline-flex" />
          <div className="font-serif text-sm tracking-tight text-on-surface whitespace-nowrap">
            {activePage}
          </div>
        </div>

        <div className="hidden md:flex items-center ghost-border rounded px-3 h-8 bg-surface-container-low/60 focus-within:border-primary/60 transition-colors">
          <Search
            size={14}
            strokeWidth={1.75}
            className="text-stone-400 mr-2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search artist or year…"
            aria-label="Search covers"
            className="bg-transparent border-none outline-none text-data-mono text-on-surface w-44 placeholder-stone-500 focus:ring-0"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="ml-1 text-stone-500 hover:text-on-surface transition-colors"
            >
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Right: decades + relationship mode + filter count */}
      <div className="flex items-center gap-4 flex-wrap justify-end">
        <button
          onClick={onExhibition}
          className="hidden md:flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2.5 py-1 text-data-mono text-[10px] uppercase tracking-widest text-primary hover:bg-primary/20 transition-colors"
        >
          <PlayCircle size={13} strokeWidth={1.75} />
          Exhibition
        </button>

        {/* Decade filter */}
        <nav
          className="hidden lg:flex items-center gap-3"
          aria-label="Decade filter"
        >
          <button
            onClick={() => onDecadeChange(null)}
            className={`font-serif text-sm tracking-tight transition-colors ${
              !decadeFilter
                ? "text-primary border-b border-primary"
                : "text-stone-400 hover:text-primary/70"
            }`}
          >
            All
          </button>
          {DECADES.map((decade: Decade) => {
            const isActive = decadeFilter === decade;
            return (
              <button
                key={decade}
                onClick={() => onDecadeChange(isActive ? null : decade)}
                className={`font-serif text-sm tracking-tight transition-colors ${
                  isActive
                    ? "text-primary border-b border-primary"
                    : "text-stone-400 hover:text-primary/70"
                }`}
              >
                {decade}
              </button>
            );
          })}
        </nav>

        <div className="h-4 w-px bg-white/15 hidden lg:block" />

        {/* Relationship mode */}
        <label className="flex items-center gap-2 text-data-mono text-[10px] uppercase tracking-widest text-stone-400">
          <SlidersHorizontal
            size={14}
            strokeWidth={1.75}
            className="text-stone-400"
          />
          <span className="hidden xl:inline">Relationship</span>
          <select
            value={relationshipMode}
            onChange={(e) =>
              onRelationshipModeChange(e.target.value as RelationshipMode)
            }
            aria-label="Relationship mode"
            className="bg-surface-container-low border border-white/10 rounded px-2 py-1 text-on-surface focus:outline-none focus:border-primary/60"
          >
            {RELATIONSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {/* Result count */}
        <span
          className={`text-data-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded ghost-border whitespace-nowrap ${
            filtersActive
              ? "text-primary border-primary/40"
              : "text-stone-400"
          }`}
        >
          {visibleCount} / {totalCount}
        </span>
      </div>
    </header>
  );
}
