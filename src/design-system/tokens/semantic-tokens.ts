export const semanticTokens = {
  background: {
    canvas: "#f8f6f0",
    elevated: "#fffdf8",
    muted: "#eef6f2",
  },
  surface: {
    overlay: "rgba(255, 253, 248, 0.92)",
    strong: "#fffdf8",
    muted: "#f2f4ee",
  },
  text: {
    primary: "#1f2b28",
    muted: "#61706b",
    accent: "#0d7c66",
    inverted: "#f8f9f6",
  },
  border: {
    subtle: "rgba(110, 122, 117, 0.18)",
    strong: "rgba(13, 124, 102, 0.22)",
  },
  state: {
    processing: "#0d7c66",
    success: "#059669",
    warning: "#9a6100",
    danger: "#dc2626",
  },
} as const;
