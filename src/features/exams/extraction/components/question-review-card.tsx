import { cn } from "@/lib/utils";
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
      <div className="flex flex-col gap-4">
        {question.extractionWarning ? (
          <ProcessingBanner message={question.extractionWarning} />
        ) : null}

        <p className="text-sm text-text-primary">{question.content}</p>

        {question.visualElements?.length ? (
          <ExtractionWarningList
            warnings={question.visualElements.map(
              (visualElement) => `${visualElement.type}: ${visualElement.description}`,
            )}
          />
        ) : null}

        {question.questionType === "objective" && question.alternatives ? (
          <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
            <legend className="mb-2 text-sm font-semibold text-text-primary">
              Alternativa correta
            </legend>
            <div className="flex flex-col gap-3">
              {question.alternatives.map((alternative) => {
                const label = `${alternative.label} ${alternative.text}`;
                const isSelected = value === alternative.label;

                return (
                  <label
                    key={alternative.label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "border-brand-300 bg-brand-50"
                        : "border-border-default bg-white hover:border-border-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={alternative.label}
                      checked={isSelected}
                      disabled={disabled}
                      aria-label={label}
                      onChange={() => onChange(alternative.label)}
                      className="h-4 w-4 border-border-default text-brand-600 focus:ring-brand-200"
                    />
                    <span className="text-text-primary">{alternative.label}) {alternative.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`answer-${question.id}`} className="text-sm font-semibold text-text-primary">
              Resposta esperada da questão {question.orderNum}
            </label>
            <input
              id={`answer-${question.id}`}
              type="text"
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.currentTarget.value)}
              className="h-10 w-full rounded-xl border border-border-default bg-white px-3.5 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 hover:border-border-strong"
            />
          </div>
        )}
      </div>
    </FormSection>
  );
}
