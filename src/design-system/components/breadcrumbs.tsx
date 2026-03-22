type BreadcrumbItem = {
  label: string;
  href: string;
};

type BreadcrumbsProps = Readonly<{
  items: BreadcrumbItem[];
}>;

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumbs">
      <ol
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          padding: 0,
          margin: 0,
          listStyle: "none",
          color: "var(--color-text-muted)",
          fontSize: "0.88rem",
        }}
      >
        {items.map((item, index) => (
          <li
            key={`${item.href}-${item.label}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span>{item.label}</span>
            {index < items.length - 1 ? <span aria-hidden="true">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
