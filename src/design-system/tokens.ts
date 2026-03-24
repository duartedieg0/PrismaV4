/**
 * Prisma Design Tokens
 *
 * Single source of truth for design decisions.
 * These mirror the CSS custom properties defined in globals.css
 * and are used when TypeScript access to token values is needed.
 */

export const colors = {
  brand: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },
  accent: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
  },
  surface: {
    canvas: "#fafaf9",
    default: "#ffffff",
    muted: "#f5f5f4",
    raised: "#fefefe",
    terminal: "#0f172a",
    terminalSoft: "#1e293b",
  },
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    muted: "#94a3b8",
    inverse: "#f8fafc",
    brand: "#059669",
    terminal: "#34d399",
  },
  border: {
    default: "#e7e5e4",
    muted: "#f5f5f4",
    strong: "#d6d3d1",
    brand: "rgba(5, 150, 105, 0.25)",
  },
  state: {
    success: "#059669",
    warning: "#d97706",
    danger: "#dc2626",
    info: "#2563eb",
  },
} as const;

export const typography = {
  family: {
    display: "var(--font-display)",
    body: "var(--font-body)",
    code: "var(--font-code)",
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
} as const;

export const layout = {
  container: {
    narrow: "64rem",
    page: "80rem",
    wide: "90rem",
  },
  radius: {
    xs: "0.25rem",
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    "3xl": "1.5rem",
    pill: "9999px",
  },
} as const;
