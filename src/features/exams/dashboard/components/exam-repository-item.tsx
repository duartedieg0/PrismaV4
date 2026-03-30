import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/design-system/components/badge";
import { Card } from "@/design-system/components/card";
import { Button } from "@/design-system/components/button";
import type { TeacherExamListItem } from "@/features/exams/dashboard/contracts";

const statusTone: Record<TeacherExamListItem["statusTone"], string> = {
  default: "border-l-[var(--color-success)]",
  destructive: "border-l-[var(--color-danger)]",
  outline: "border-l-[var(--color-border-strong)]",
  secondary: "border-l-[var(--color-warning)]",
};

const statusBadgeVariant: Record<TeacherExamListItem["statusTone"], "success" | "danger" | "outline" | "warning"> = {
  default: "success",
  destructive: "danger",
  outline: "outline",
  secondary: "warning",
};

function getStatusAccent(tone: TeacherExamListItem["statusTone"]) {
  switch (tone) {
    case "default":
      return "var(--color-success)";
    case "destructive":
      return "var(--color-danger)";
    case "outline":
      return "var(--color-text-secondary)";
    case "secondary":
      return "var(--color-warning)";
    default:
      return "var(--color-text-secondary)";
  }
}

function getActionLabel(exam: TeacherExamListItem) {
  if (exam.status === "completed") {
    return "Ver resultado";
  }

  if (exam.status === "error") {
    return "Ver erro";
  }

  if (exam.status === "awaiting_answers") {
    return "Revisar questões";
  }

  return "Ver progresso";
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

function formatAbsoluteDate(date: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

type ExamRepositoryItemProps = Readonly<{ exam: TeacherExamListItem }>;

export function ExamRepositoryItem({ exam }: ExamRepositoryItemProps) {
  const accent = getStatusAccent(exam.statusTone);
  const actionLabel = getActionLabel(exam);

  return (
    <Card
      hover
      padding="none"
      className={cn("border-l-4 overflow-hidden", statusTone[exam.statusTone])}
    >
      <Link href={exam.href} className="grid gap-4 p-5 no-underline text-inherit">
        <div className="flex flex-col gap-1.5">
          <Badge variant={statusBadgeVariant[exam.statusTone]} size="sm">
            {exam.statusLabel}
          </Badge>
          <h3 className="text-base font-semibold leading-tight text-text-primary">
            {exam.topic}
          </h3>
          <p className="text-sm text-text-secondary">
            {exam.subjectName} · {exam.gradeLevelName}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {exam.supports.length > 0 ? (
            exam.supports.map((support) => (
              <Badge key={support} variant="outline" size="sm">
                {support}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-text-secondary">Nenhum apoio selecionado</span>
          )}
        </div>

        {exam.errorMessage ? (
          <p role="alert" className="text-sm font-semibold text-danger">
            {exam.errorMessage}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-4 border-t border-border-default pt-4">
          <span className="text-xs text-text-secondary" title={formatAbsoluteDate(exam.updatedAt)}>
            {formatRelativeDate(exam.updatedAt)}
          </span>
          <span className="text-sm font-bold" style={{ color: accent }}>
            {actionLabel} &rarr;
          </span>
        </div>
      </Link>
    </Card>
  );
}
