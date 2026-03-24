import { CopyActionBar } from "@/features/exams/results/components/copy-action-bar";
import { FeedbackForm } from "@/features/exams/results/components/feedback-form";
import type { AdaptationResultView } from "@/features/exams/results/contracts";

type AdaptationResultCardProps = {
  examId: string;
  adaptation: AdaptationResultView;
  onCopy?: (text: string) => Promise<void> | void;
};

export function AdaptationResultCard({
  examId,
  adaptation,
  onCopy,
}: AdaptationResultCardProps) {
  if (adaptation.status === "error") {
    return <p className="text-sm text-red-600">Erro ao adaptar a questão.</p>;
  }

  if (!adaptation.adaptedContent) {
    return <p className="text-sm text-text-secondary">Adaptação não disponível.</p>;
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface-muted/50 p-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-text-primary">{adaptation.supportName}</h4>
        <p className="text-sm text-text-primary">{adaptation.adaptedContent}</p>
      </div>

      {(adaptation.bnccSkills?.length || adaptation.bloomLevel) ? (
        <div className="flex flex-wrap gap-2">
          {adaptation.bnccSkills?.length ? (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              {adaptation.bnccSkills.join(", ")}
            </span>
          ) : null}
          {adaptation.bloomLevel ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {adaptation.bloomLevel}
            </span>
          ) : null}
        </div>
      ) : null}

      {adaptation.copyBlock ? (
        <CopyActionBar
          adaptationId={adaptation.adaptationId}
          examId={examId}
          onCopy={onCopy}
          supportId={adaptation.supportId}
          text={adaptation.copyBlock.text}
        />
      ) : null}

      <FeedbackForm
        adaptationId={adaptation.adaptationId}
        examId={examId}
        existingFeedback={adaptation.feedback}
      />
    </article>
  );
}
