type ExtractionWarningListProps = Readonly<{
  warnings: string[];
}>;

export function ExtractionWarningList({ warnings }: ExtractionWarningListProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Warnings de extração"
      style={{
        margin: 0,
        paddingLeft: "1.25rem",
        color: "var(--warning)",
      }}
    >
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}
