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
    return <p>Erro ao adaptar a questão.</p>;
  }

  if (!adaptation.adaptedContent) {
    return <p>Adaptação não disponível.</p>;
  }

  return (
    <article
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1.1rem",
        borderRadius: "var(--radius-card)",
        background: "rgba(248,250,252,0.92)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <div style={{ display: "grid", gap: "0.4rem" }}>
        <h4 style={{ margin: 0 }}>{adaptation.supportName}</h4>
        <p style={{ margin: 0 }}>{adaptation.adaptedContent}</p>
      </div>

      {(adaptation.bnccSkills?.length || adaptation.bloomLevel) ? (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {adaptation.bnccSkills?.length ? (
            <span style={{ padding: "0.45rem 0.7rem", borderRadius: "999px", background: "rgba(238,242,255,0.8)", color: "var(--color-text-accent)", fontSize: "0.9rem" }}>
              {adaptation.bnccSkills.join(", ")}
            </span>
          ) : null}
          {adaptation.bloomLevel ? (
            <span style={{ padding: "0.45rem 0.7rem", borderRadius: "999px", background: "rgba(236,253,245,0.9)", color: "var(--success)", fontSize: "0.9rem" }}>
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
