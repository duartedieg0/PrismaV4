type SectionShellProps = Readonly<{
  children: React.ReactNode;
  width?: "reading" | "wide" | "xwide";
}>;

export function SectionShell({ children, width = "wide" }: SectionShellProps) {
  const widthToken =
    width === "reading"
      ? "var(--container-reading)"
      : width === "xwide"
        ? "var(--container-xwide)"
        : "var(--container-wide)";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "var(--space-section) var(--space-gutter)",
      }}
    >
      <div
        style={{
          width: `min(100%, ${widthToken})`,
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </main>
  );
}
