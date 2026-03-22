"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormSection } from "@/design-system/components/form-section";
import { InlineError } from "@/design-system/components/inline-error";
import { Surface } from "@/design-system/components/surface";
import { createExamInputSchema, validatePdfFile } from "@/features/exams/create/validation";
import { PdfDropzone } from "@/features/exams/create/components/pdf-dropzone";
import {
  SupportSelector,
  type SupportOption,
} from "@/features/exams/create/components/support-selector";

type SelectOption = {
  id: string;
  name: string;
};

type NewExamFormProps = Readonly<{
  subjects: SelectOption[];
  gradeLevels: SelectOption[];
  supports: SupportOption[];
}>;

type FormErrors = Partial<Record<"subjectId" | "gradeLevelId" | "topic" | "supportSelections" | "uploadedPdf", string>>;

export function NewExamForm({
  subjects,
  gradeLevels,
  supports,
}: NewExamFormProps) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState("");
  const [gradeLevelId, setGradeLevelId] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedSupportIds, setSelectedSupportIds] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearError(field: keyof FormErrors) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function toggleSupport(supportId: string) {
    clearError("supportSelections");
    setSelectedSupportIds((current) =>
      current.includes(supportId)
        ? current.filter((id) => id !== supportId)
        : [...current, supportId],
    );
  }

  function validateForm() {
    const pdfError = validatePdfFile(pdfFile);

    const result = createExamInputSchema.safeParse({
      subjectId,
      gradeLevelId,
      topic: topic.trim() ? topic.trim() : undefined,
      supportSelections: selectedSupportIds.map((supportId) => ({
        supportId,
      })),
      uploadedPdf: {
        fileName: pdfFile?.name ?? "",
        fileType: pdfFile?.type ?? "",
        fileSize: pdfFile?.size ?? 0,
      },
    });

    if (result.success && !pdfError) {
      setErrors({});
      return true;
    }

    const fieldErrors = result.success
      ? {}
      : result.error.flatten().fieldErrors;

    setErrors({
      subjectId: fieldErrors.subjectId?.[0],
      gradeLevelId: fieldErrors.gradeLevelId?.[0],
      topic: fieldErrors.topic?.[0],
      supportSelections: fieldErrors.supportSelections?.[0],
      uploadedPdf: pdfError ?? fieldErrors.uploadedPdf?.[0],
    });

    return false;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm() || !pdfFile || supports.length === 0) {
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("subjectId", subjectId);
    formData.append("gradeLevelId", gradeLevelId);
    formData.append("topic", topic.trim());
    formData.append("supportIds", JSON.stringify(selectedSupportIds));

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao enviar a prova.");
      }

      toast.success("Prova enviada para adaptação.");
      startTransition(() => {
        router.refresh();
        router.push(`/exams/${payload.examId}/processing`);
      });
    } catch (submissionError) {
      toast.error(
        submissionError instanceof Error
          ? submissionError.message
          : "Erro ao enviar a prova.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Surface padding="clamp(1.4rem, 2vw, 1.9rem)">
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gap: "0.5rem",
            padding: "1.15rem 1.2rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(110,122,117,0.08)",
            boxShadow: "0 14px 30px rgba(28,25,23,0.04)",
          }}
        >
          <strong style={{ fontSize: "1rem" }}>Preparação da adaptação</strong>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Organize disciplina, série, tema, apoios e PDF em um único fluxo antes de enviar a prova.
          </p>
        </div>
        <FormSection title="Informações da prova">
          <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <label htmlFor="subject-id" style={{ fontWeight: 600 }}>
                Disciplina
              </label>
              <select
                id="subject-id"
                value={subjectId}
                disabled={isSubmitting}
                onChange={(event) => {
                  clearError("subjectId");
                  setSubjectId(event.currentTarget.value);
                }}
              >
                <option value="">Selecione uma disciplina</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {errors.subjectId ? <InlineError message={errors.subjectId} /> : null}
            </div>

            <div style={{ display: "grid", gap: "0.5rem" }}>
              <label htmlFor="grade-level-id" style={{ fontWeight: 600 }}>
                Ano/Série
              </label>
              <select
                id="grade-level-id"
                value={gradeLevelId}
                disabled={isSubmitting}
                onChange={(event) => {
                  clearError("gradeLevelId");
                  setGradeLevelId(event.currentTarget.value);
                }}
              >
                <option value="">Selecione um ano/série</option>
                {gradeLevels.map((gradeLevel) => (
                  <option key={gradeLevel.id} value={gradeLevel.id}>
                    {gradeLevel.name}
                  </option>
                ))}
              </select>
              {errors.gradeLevelId ? <InlineError message={errors.gradeLevelId} /> : null}
            </div>

            <div style={{ display: "grid", gap: "0.5rem" }}>
              <label htmlFor="topic" style={{ fontWeight: 600 }}>
                Tema
              </label>
              <textarea
                id="topic"
                value={topic}
                disabled={isSubmitting}
                placeholder="Ex.: Frações, Brasil República, Revolução Industrial"
                onChange={(event) => {
                  clearError("topic");
                  setTopic(event.currentTarget.value);
                }}
                rows={4}
              />
              {errors.topic ? <InlineError message={errors.topic} /> : null}
            </div>

            <SupportSelector
              supports={supports}
              selectedSupportIds={selectedSupportIds}
              onToggle={toggleSupport}
              disabled={isSubmitting}
              errorMessage={errors.supportSelections}
            />

            <PdfDropzone
              file={pdfFile}
              disabled={isSubmitting}
              errorMessage={errors.uploadedPdf}
              onChange={(file) => {
                clearError("uploadedPdf");
                setPdfFile(file);
              }}
            />
          </div>
        </FormSection>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            O envio inicia extração e adaptação mantendo revisão humana obrigatória.
          </p>
          <button
            type="submit"
            disabled={isSubmitting || supports.length === 0}
            aria-busy={isSubmitting}
            style={{
              borderRadius: "0.85rem",
              background: "linear-gradient(135deg, #9a6100, #c88718)",
              boxShadow: "0 14px 30px rgba(154, 97, 0, 0.14)",
            }}
          >
            {isSubmitting ? "Enviando prova" : "Enviar para adaptação"}
          </button>
        </div>
      </form>
    </Surface>
  );
}
