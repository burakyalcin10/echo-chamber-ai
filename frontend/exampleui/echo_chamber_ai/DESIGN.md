---
name: Echo Chamber AI
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d1c5b4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9a8f80'
  outline-variant: '#4e4639'
  surface-tint: '#e9c176'
  primary: '#e9c176'
  on-primary: '#412d00'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#775a19'
  secondary: '#ffb4a5'
  on-secondary: '#5b1a0e'
  secondary-container: '#7b3224'
  on-secondary-container: '#ff9f8c'
  tertiary: '#b5cad4'
  on-tertiary: '#20333b'
  tertiary-container: '#94a8b2'
  on-tertiary-container: '#2b3d46'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a5'
  on-secondary-fixed: '#3e0501'
  on-secondary-fixed-variant: '#783022'
  tertiary-fixed: '#d1e6f0'
  tertiary-fixed-dim: '#b5cad4'
  on-tertiary-fixed: '#0a1e26'
  on-tertiary-fixed-variant: '#374952'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 4.5rem
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Newsreader
    fontSize: 3rem
    fontWeight: '400'
    lineHeight: '1.2'
  h2:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.6'
  data-mono:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin: 64px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is defined by an **Archival Minimalism** aesthetic—a synthesis of historical preservation and cutting-edge artificial intelligence. It targets cultural connoisseurs, musicologists, and data analysts who seek depth over superficiality. The UI should evoke a sense of "intellectual melancholy," feeling like a digital vault that is both ancient and futuristic.

The visual style utilizes high-contrast hierarchy to guide the user through vast amounts of information. It avoids modern "friendliness" in favor of a sophisticated, editorial presence. Key visual motifs include:
*   **Cinematic Immersion:** Full-bleed dark surfaces that allow album art and data visualizations to glow.
*   **Tactile History:** Subtle application of film grain and paper textures to soften the digital edge.
*   **Technical Precision:** Fine lines reminiscent of blueprints and waveform data overlays.

## Colors

The palette is rooted in a "void-like" base of absolute black and deep charcoal, ensuring that the screen disappears in low-light environments to emphasize content. 

*   **Accents:** The muted amber (#C5A059) is used for primary actions and highlights, suggesting the glow of a vacuum tube or aged parchment. The rust-red (#8B3E2F) serves as a secondary accent for critical data points or "recording" states.
*   **Archive Tones:** Desaturated blues and greens are reserved for multi-variate data visualizations, providing a historical, faded aesthetic to complex charts.
*   **Contrast:** Use absolute black for the deepest background layers and charcoal for elevated surfaces or containers. Text should never be pure white; use the warm off-white (#F5F5F0) to reduce eye strain and maintain the archival feel.

## Typography

This design system employs a strict typographic contrast between the emotional and the analytical.

*   **Serif (Newsreader):** Used for all storytelling elements, headings, and quotes. It should feel literary and authoritative. Use "Display" weights for large headlines to emphasize the elegant, tapered serifs.
*   **Sans-Serif (Inter):** Used for interface controls, metadata, and dense data visualizations. It provides a clean, neutral counterpoint to the serif headings.
*   **Styling:** Titles should use sentence case for a modern editorial feel. Metadata labels should frequently use all-caps with generous letter spacing to evoke a cataloging system.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** approach for content-heavy pages to ensure an editorial, "book-like" structure, while shifting to a **Fluid Grid** for interactive data dashboards.

*   **Rhythm:** A 4px baseline grid ensures vertical consistency. 
*   **Composition:** Use wide margins (64px+) to create a cinematic frame around content. Negative space is a primary tool to convey "sophistication" and to prevent the dark interface from feeling claustrophobic.
*   **Grid:** A 12-column system is used. Editorial content usually occupies the center 8 columns, while data-heavy sidebars or filters occupy the outer 2-4 columns.

## Elevation & Depth

In a world of absolute black, depth is created through **Tonal Layering** rather than traditional shadows.

*   **Surfaces:** The base layer is #000000. Elements that sit "above" the base use #121212. Interactive cards or hovering elements use a slightly lighter charcoal (#1A1A1A).
*   **Outlines:** Use low-contrast "ghost borders" (1px solid, 15% opacity off-white) to define containers without breaking the dark immersion.
*   **Textures:** Apply a global, low-opacity film grain overlay to the entire UI. This unifies the digital elements and gives the impression of looking at a physical archive through a lens.
*   **Active States:** Interactive elements do not rise (Z-axis); instead, they "glow." Use subtle outer glows with the primary amber color to indicate focus or activity.

## Shapes

To maintain the archival and serious tone of the design system, the shape language is strictly **Sharp (0px)**. 

*   **Geometry:** Right angles reinforce the feeling of a precise, technical instrument or a printed ledger. 
*   **Exceptions:** The only rounded elements permitted are circular play/pause buttons or specialized data nodes in visualization maps to distinguish "organic" musical data from the "structured" archive frame.
*   **Dividers:** Lines should be hair-thin (0.5pt to 1pt) to maintain a delicate, high-end feel.

## Components

*   **Buttons:** Primary buttons use a solid amber background with black text. Secondary buttons are "Ghost" style with thin borders and off-white text. All buttons use sharp corners and uppercase labels.
*   **Input Fields:** Minimalist design with only a bottom border. Labels float above the field in a small, tracked-out sans-serif.
*   **Cards:** Use a tonal charcoal background (#121212). Imagery within cards should have a slight desaturation filter that returns to full color only on hover.
*   **Waveforms:** Interactive audio elements should be rendered as thin, precise lines. Use the secondary rust/red color to indicate the playback progress.
*   **Interactive Data Nodes:** In the visualization platform, nodes should be small, glowing dots. Connections between nodes should be 0.5px "dusty blue" lines.
*   **Chips/Tags:** Used for genre or era categorization. These should resemble physical archive labels—small, rectangular, with a subtle paper texture background and monospaced-style sans-serif text.