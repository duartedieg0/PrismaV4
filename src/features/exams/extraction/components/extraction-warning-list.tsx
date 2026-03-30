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
      className="m-0 list-disc pl-5 text-sm text-[var(--color-warning)]"
    >
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}
