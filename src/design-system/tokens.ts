/**
 * Prisma Design Tokens
 *
 * Single source of truth for design decisions.
 * These mirror the CSS custom properties defined in globals.css
 * and are used when TypeScript access to token values is needed.
 */

export const colors = {
  brand: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
    950: "#1E1B4B",
  },
  accent: {
    50: "#FDF4EE",
    100: "#FCE6D4",
    200: "#F8C9A3",
    300: "#F3A76D",
    400: "#E8893D",
    500: "#C2703E",
    600: "#A65A30",
    700: "#8A4626",
  },
  surface: {
    canvas: "#FAFAFA",
    default: "#FFFFFF",
    muted: "#F5F5F5",
    raised: "#FEFEFE",
    dark: "#312E81",
    darkSoft: "#3730A3",
  },
  text: {
    primary: "#111827",
    secondary: "#4B5563",
    muted: "#9CA3AF",
    inverse: "#F9FAFB",
    brand: "#4F46E5",
  },
  border: {
    default: "#E5E7EB",
    muted: "#F3F4F6",
    strong: "#D1D5DB",
    brand: "rgba(79, 70, 229, 0.2)",
  },
  state: {
    success: "#059669",
    warning: "#D97706",
    danger: "#DC2626",
    info: "#4F46E5",
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
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    pill: "9999px",
  },
} as const;
