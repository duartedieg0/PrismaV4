"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/design-system/components/button";
import { FormSection } from "@/design-system/components/form-section";
import { InlineError } from "@/design-system/components/inline-error";
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
        throw new Error(payload.error?.message ?? "Erro ao enviar a prova.");
      }

      toast.success("Prova enviada para adaptação.");
      startTransition(() => {
        router.refresh();
        router.push(`/exams/${payload.data.examId}/processing`);
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border-default bg-white p-5">
        <div className="flex flex-col gap-1">
          <strong className="text-base font-semibold text-text-primary">Preparação da adaptação</strong>
          <p className="text-sm text-text-secondary">
            Organize disciplina, série, tema, apoios e PDF.
          </p>
        </div>
      </div>

      <FormSection title="Informações da prova">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="subject-id" className="text-sm font-semibold text-text-primary">
              Disciplina <span className="text-danger">*</span>
            </label>
            <select
              id="subject-id"
              className="h-10 w-full rounded-xl border border-border-default bg-white px-3.5 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 hover:border-border-strong"
              value={subjectId}
              disabled={isSubmitting}
              onChange={(event) => {
                clearError("subjectId");
                setSubjectId(event.currentTarget.value);
              }}
              onBlur={() => {
                if (!subjectId) {
                  setErrors((current) => ({ ...current, subjectId: "Selecione uma disciplina." }));
                }
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="grade-level-id" className="text-sm font-semibold text-text-primary">
              Ano/Série <span className="text-danger">*</span>
            </label>
            <select
              id="grade-level-id"
              className="h-10 w-full rounded-xl border border-border-default bg-white px-3.5 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 hover:border-border-strong"
              value={gradeLevelId}
              disabled={isSubmitting}
              onChange={(event) => {
                clearError("gradeLevelId");
                setGradeLevelId(event.currentTarget.value);
              }}
              onBlur={() => {
                if (!gradeLevelId) {
                  setErrors((current) => ({ ...current, gradeLevelId: "Selecione um ano/série." }));
                }
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="topic" className="text-sm font-semibold text-text-primary">
              Tema <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            <textarea
              id="topic"
              className="resize-y min-h-24 py-2.5 w-full rounded-xl border border-border-default bg-white px-3.5 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 hover:border-border-strong"
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-text-secondary">
          O envio inicia extração das questões.
        </p>
        <Button
          type="submit"
          variant="accent"
          size="md"
          disabled={isSubmitting || supports.length === 0}
        >
          {isSubmitting ? "Enviando prova" : "Enviar para adaptação"}
        </Button>
      </div>
    </form>
  );
}
