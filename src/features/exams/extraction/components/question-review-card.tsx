import { FormSection } from "@/design-system/components/form-section";
import { ProcessingBanner } from "@/design-system/components/processing-banner";
import { ExtractionWarningList } from "@/features/exams/extraction/components/extraction-warning-list";

type QuestionReviewCardProps = Readonly<{
  question: {
    id: string;
    orderNum: number;
    content: string;
    questionType: "objective" | "essay";
    alternatives: Array<{ label: string; text: string }> | null;
    visualElements: Array<{ type: string; description: string }> | null;
    extractionWarning: string | null;
  };
  value: string;
  disabled?: boolean;
  onChange(nextValue: string): void;
}>;

export function QuestionReviewCard({
  question,
  value,
  disabled = false,
  onChange,
}: QuestionReviewCardProps) {
  return (
    <FormSection title={`Questão ${question.orderNum}`}>
      <div style={{ display: "grid", gap: "1rem" }}>
        {question.extractionWarning ? (
          <ProcessingBanner message={question.extractionWarning} />
        ) : null}

        <p style={{ margin: 0, fontSize: "1rem" }}>{question.content}</p>

        {question.visualElements?.length ? (
          <ExtractionWarningList
            warnings={question.visualElements.map(
              (visualElement) => `${visualElement.type}: ${visualElement.description}`,
            )}
          />
        ) : null}

        {question.questionType === "objective" && question.alternatives ? (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: "0.75rem" }}>
              Alternativa correta
            </legend>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {question.alternatives.map((alternative) => {
                const label = `${alternative.label} ${alternative.text}`;

                return (
                  <label
                    key={alternative.label}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.9rem 1rem",
                      borderRadius: "var(--radius-card)",
                      border: "1px solid var(--color-border-subtle)",
                      background: value === alternative.label ? "rgba(238,242,255,0.72)" : "rgba(255,255,255,0.72)",
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={alternative.label}
                      checked={value === alternative.label}
                      disabled={disabled}
                      aria-label={label}
                      onChange={() => onChange(alternative.label)}
                    />
                    <span>{alternative.label}) {alternative.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <label htmlFor={`answer-${question.id}`} style={{ fontWeight: 600 }}>
              Resposta esperada da questão {question.orderNum}
            </label>
            <input
              id={`answer-${question.id}`}
              type="text"
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.currentTarget.value)}
            />
          </div>
        )}
      </div>
    </FormSection>
  );
}
