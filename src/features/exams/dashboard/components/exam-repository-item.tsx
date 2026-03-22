import { StatusBadge } from "@/design-system/components/status-badge";
import type { TeacherExamListItem } from "@/features/exams/dashboard/contracts";

function getStatusAccent(
  tone: TeacherExamListItem["statusTone"],
) {
  switch (tone) {
    case "default":
      return "#10b981";
    case "destructive":
      return "#dc2626";
    case "outline":
      return "#64766f";
    case "secondary":
      return "#9a6100";
    default:
      return "#0d7c66";
  }
}

function getActionLabel(exam: TeacherExamListItem) {
  if (exam.status === "completed") {
    return "Visualizar";
  }

  if (exam.status === "error") {
    return "Ver detalhes";
  }

  if (exam.status === "awaiting_answers") {
    return "Continuar";
  }

  return "Acompanhar";
}

function formatRelativeDate(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
}

export function ExamRepositoryItem({
  exam,
}: Readonly<{ exam: TeacherExamListItem }>) {
  const accent = getStatusAccent(exam.statusTone);
  const actionLabel = getActionLabel(exam);

  return (
    <li
      style={{
        listStyle: "none",
        border: "1px solid rgba(110,122,117,0.08)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: "1rem",
        padding: "1.2rem 1.2rem 1rem",
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 16px 36px rgba(28,25,23,0.05)",
      }}
    >
      <a
        href={exam.href}
        style={{
          display: "grid",
          gap: "1rem",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <StatusBadge label={exam.statusLabel} tone={exam.statusTone} />
            <h3 style={{ margin: 0, fontSize: "1.05rem", lineHeight: 1.28 }}>
              {exam.topic}
            </h3>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
              {exam.subjectName} · {exam.gradeLevelName}
            </p>
          </div>
          <span
            aria-hidden="true"
            style={{
              color: "rgba(26,28,27,0.48)",
              fontWeight: 900,
              letterSpacing: "0.2em",
              lineHeight: 1,
            }}
          >
            ⋮
          </span>
        </div>

        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Apoios: {exam.supports.length > 0 ? exam.supports.join(", ") : "Nenhum apoio selecionado"}
        </p>
        {exam.errorMessage ? (
          <p role="alert" style={{ margin: 0, color: "var(--danger)", fontWeight: 600, fontSize: "0.9rem" }}>
            {exam.errorMessage}
          </p>
        ) : null}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            paddingTop: "0.9rem",
            borderTop: "1px solid rgba(110,122,117,0.12)",
          }}
        >
          <span style={{ color: "rgba(97,112,107,0.86)", fontSize: "0.82rem" }}>
            {formatRelativeDate(exam.updatedAt)}
          </span>
          <span style={{ color: accent, fontWeight: 800, fontSize: "0.92rem" }}>
            {actionLabel} →
          </span>
        </div>
      </a>
    </li>
  );
}
