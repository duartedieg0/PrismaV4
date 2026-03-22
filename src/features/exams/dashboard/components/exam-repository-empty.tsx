import { EmptyState } from "@/design-system/components/empty-state";

export function ExamRepositoryEmpty() {
  return (
    <section
      style={{
        display: "grid",
        gap: "1.25rem",
        justifyItems: "start",
        border: "1px dashed rgba(110,122,117,0.18)",
        borderRadius: "1rem",
        padding: "1.7rem",
        background: "rgba(255,255,255,0.8)",
      }}
    >
      <EmptyState message="Nenhuma prova adaptada ainda" />
      <a
        href="/exams/new"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "2.75rem",
          paddingInline: "1.25rem",
          borderRadius: "0.85rem",
          background: "linear-gradient(135deg, #9a6100, #c88718)",
          color: "var(--color-text-inverted)",
          textDecoration: "none",
          fontWeight: 800,
        }}
      >
        Nova Prova
      </a>
    </section>
  );
}
