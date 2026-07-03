---
name: Knowledge Base Evaluation Design System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-semibold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base_unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container_margin: 24px
  gutter: 16px
---

## Brand & Style

The design system is engineered for a high-performance B2B SaaS environment focused on technical evaluation and data analysis. The brand personality is **authoritative, precise, and systematic**, mirroring the rigor required for AI and knowledge base benchmarking. 

Drawing from **Corporate / Modern** aesthetics with a lean toward **Linear-inspired minimalism**, the UI prioritizes clarity over decoration. It utilizes a structured information architecture that facilitates deep focus during long analytical sessions. The visual language conveys reliability through balanced proportions, a restricted color palette, and high-quality typography. The goal is to make complex data sets feel manageable and actionable.

## Colors

The color system is rooted in functional utility. **Indigo (#4F46E5)** serves as the primary action color, providing a strong visual anchor for navigation and primary conversions. 

The semantic palette (Success, Warning, Error) is calibrated for high legibility against white and slate backgrounds, ensuring that status indicators are immediately recognizable. The neutral palette relies on **Slate** tones to create a soft hierarchy:
- **Slate-900** for high-contrast headings.
- **Slate-700** for comfortable long-form reading.
- **Slate-50** for the base canvas to reduce eye strain compared to pure white.
- **Slate-200** for UI borders, creating clear containment without visual noise.

All color combinations meet **WCAG AA** standards for accessibility.

## Typography

This design system utilizes **Inter** as the primary typeface for its exceptional legibility in data-heavy interfaces. For Chinese characters, the system fallbacks to high-quality sans-serif system fonts (e.g., Noto Sans SC) to maintain a consistent weight.

The scale is intentionally compact. The **14px base size** allows for high information density required for admin dashboards, while **12px labels** are used for metadata and secondary descriptions. Bold and Semibold weights are used strictly for hierarchy and section identification. For JSON previews and technical data, **JetBrains Mono** is introduced to ensure character distinction.

## Layout & Spacing

The system follows an **8px linear grid** to ensure mathematical consistency across all components. 

The layout utilizes a **Fixed-Fluid hybrid model**:
- **Sidebar:** Fixed width (256px) for persistent navigation.
- **Content Area:** Fluid width with a max-width cap of 1440px for optimal readability on ultra-wide monitors.
- **KPI Grids:** 3-column layout that reflows to 1-column on mobile.
- **Tables:** Full-width container with horizontal scroll for overflow data.

Padding within cards is consistently **24px (lg)**, while internal element spacing (e.g., label to input) uses **8px (sm)**. This creates a "breathable density"—information is packed but never cluttered.

## Elevation & Depth

Hierarchy is established using a **Tonal Layering** approach combined with subtle shadows. 

1.  **Level 0 (Base):** Slate-50 background.
2.  **Level 1 (Card/Surface):** White background with a 1px Slate-200 border. A very soft, diffused shadow (0 1px 3px rgba(15, 23, 42, 0.08)) is applied to separate the surface from the base.
3.  **Level 2 (Dropdowns/Modals):** White background with a more pronounced shadow (0 10px 15px -3px rgba(15, 23, 42, 0.1)) to indicate temporary overlay.

No heavy blurs or glassmorphism are used; depth is purely functional, ensuring that the user’s focus remains on the evaluation data.

## Shapes

The design system adopts a **Rounded (8px)** shape language. This corner radius strikes a balance between the clinical sharpness of enterprise software and the approachability of modern SaaS.

- **Buttons & Inputs:** 8px (rounded-lg).
- **Cards:** 8px (rounded-lg).
- **Status Pills:** Fully rounded (pill) to distinguish them from interactive buttons.
- **Data Bars:** 4px (rounded-sm) to maintain a precise, technical look.

## Components

### Buttons & Controls
- **Primary Button:** Indigo background, white text. 8px radius. Hover state is Indigo-700.
- **Secondary Button:** White background, Slate-200 border, Slate-700 text.
- **Inputs:** 1px Slate-200 border, shifts to Primary Indigo on focus with a 2px soft outer glow.

### Data Display
- **Pill Status Badges:** Soft background tint (10% opacity) of the semantic color with high-contrast text. Example: Success pill has green text on a light green background.
- **Data Tables:**
    - Header: Slate-50 background, semibold text.
    - Rows: Zebra striping on hover (#F1F5F9).
    - Sticky headers for long evaluation logs.
- **JSON Panels:** Collapsible containers with a light Slate-50 background and syntax highlighting.

### Indicators
- **Step Wizards:** Vertical or horizontal connectors using the Primary color for completed steps and Slate-300 for upcoming ones.
- **KPI Cards:** Large numeric value (Slate-900) with a secondary label (Slate-500) and a small sparkline or horizontal bar for trend visualization.
- **Progress Bars:** Thin 8px tracks with the primary or semantic color fill.
