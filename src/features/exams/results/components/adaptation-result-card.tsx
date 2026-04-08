"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Sparkles,
} from "lucide-react";
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
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(
    adaptation.feedback !== null,
  );
  const [showNudge, setShowNudge] = useState(false);
  const feedbackRef = useRef<HTMLFormElement>(null);

  function handleCopySuccess() {
    if (!feedbackSubmitted && !showNudge) {
      setShowNudge(true);
    }
  }

  function handleNudgeClose() {
    setShowNudge(false);
  }

  function handleScrollToFeedback() {
    feedbackRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleFeedbackSubmit() {
    setFeedbackSubmitted(true);
    setShowNudge(false);
  }

  if (adaptation.status === "error") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
        <div>
          <p className="text-sm font-medium text-danger">Erro ao adaptar</p>
          <p className="text-xs text-red-600/80">
            Não foi possível gerar a adaptação para este apoio. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  if (!adaptation.adaptedContent) {
    return (
      <p className="text-sm text-text-muted">Adaptação não disponível para este apoio.</p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Adapted Content ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <h4 className="text-sm font-semibold text-text-primary">
            Conteúdo adaptado
          </h4>
        </div>

        <div className="rounded-xl bg-brand-50/50 p-4 ring-1 ring-brand-200/50">
          <p className="text-sm leading-relaxed text-text-primary">
            {adaptation.adaptedContent}
          </p>

          {/* Adapted Alternatives */}
          {adaptation.adaptedAlternatives && adaptation.adaptedAlternatives.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {[...adaptation.adaptedAlternatives]
                .sort((a, b) => a.position - b.position)
                .map((alt, index) => {
                  const label = String.fromCharCode(97 + index);
                  return (
                    <li
                      key={alt.id}
                      className={
                        "flex items-start gap-2 rounded-lg p-2 text-sm " +
                        (alt.isCorrect
                          ? "bg-green-50 ring-1 ring-green-200"
                          : "bg-surface-muted/50")
                      }
                    >
                      <span
                        className={
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold " +
                          (alt.isCorrect
                            ? "bg-green-600 text-white"
                            : "bg-surface-muted text-text-secondary")
                        }
                      >
                        {label}
                      </span>
                      <span className="text-text-primary">{alt.adaptedText}</span>
                    </li>
                  );
                })}
            </ul>
          ) : null}
        </div>
      </div>

      {/* ── Copy Bar ── */}
      {adaptation.copyBlock ? (
        <CopyActionBar
          adaptationId={adaptation.adaptationId}
          examId={examId}
          onCopy={onCopy}
          onCopySuccess={handleCopySuccess}
          showFeedbackNudge={showNudge}
          onNudgeClose={handleNudgeClose}
          onScrollToFeedback={handleScrollToFeedback}
          supportId={adaptation.supportId}
          text={adaptation.copyBlock.text}
        />
      ) : null}

      {/* ── Feedback ── */}
      <FeedbackForm
        ref={feedbackRef}
        adaptationId={adaptation.adaptationId}
        examId={examId}
        existingFeedback={adaptation.feedback}
        onFeedbackSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
