// Emotion score labels — mapped from API field names to display labels
export const EMOTION_LABELS: Record<string, string> = {
  surrender: "Surrender",
  defiance: "Rebellion",
  grief: "Grief",
  hope: "Hope",
  exhaustion: "Exhaustion",
  transcendence: "Transcendence",
};

// Emotion bar color classes (Tailwind)
export const EMOTION_COLORS: Record<string, string> = {
  surrender: "bg-primary",
  defiance: "bg-secondary",
  grief: "bg-tertiary",
  hope: "bg-primary-container",
  exhaustion: "bg-secondary-container",
  transcendence: "bg-tertiary-fixed-dim",
};

// Decade filter options
export const DECADES = [
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
] as const;

export type Decade = (typeof DECADES)[number];

// Edge relationship colors (Three.js hex)
export const EDGE_COLORS = {
  emotional: 0xe9c176,   // amber
  historical: 0xe5e2e1,  // off-white
  genre: 0x7b3224,       // rust
  influence: 0xc5a059,   // gold
} as const;
