type DataTableWrapperProps = Readonly<{
  children: React.ReactNode;
}>;

export function DataTableWrapper({ children }: DataTableWrapperProps) {
  return (
    <div
      role="region"
      style={{
        overflowX: "auto",
        borderRadius: "var(--radius-card)",
      }}
    >
      {children}
    </div>
  );
}
