export const layoutTokens = {
  container: {
    reading: "62rem",
    wide: "80rem",
    xwide: "90rem",
  },
  space: {
    section: "clamp(2.75rem, 5vw, 5rem)",
    gutter: "clamp(1rem, 2.5vw, 2rem)",
    stack: "clamp(1rem, 2vw, 1.4rem)",
  },
  radius: {
    panel: "2rem",
    card: "1.25rem",
    pill: "999px",
  },
  shadow: {
    soft: "0 16px 36px rgba(26, 28, 27, 0.08)",
    strong: "0 24px 64px rgba(13, 124, 102, 0.16)",
  },
} as const;
