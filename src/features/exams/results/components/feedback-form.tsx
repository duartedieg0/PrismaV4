"use client";

import { forwardRef, useState } from "react";
import { Star, Send, Check, AlertCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/design-system/components/button";

type FeedbackFormProps = {
  examId: string;
  adaptationId: string;
  existingFeedback?: {
    rating: number;
    comment: string | null;
  } | null;
  onFeedbackSubmit?: () => void;
};

export const FeedbackForm = forwardRef<HTMLFormElement, FeedbackFormProps>(
  function FeedbackForm({
    examId,
    adaptationId,
    existingFeedback,
    onFeedbackSubmit,
  }, ref) {
  const [rating, setRating] = useState<number>(existingFeedback?.rating ?? 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [showComment, setShowComment] = useState(!!existingFeedback?.comment);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0) return;
    setStatus("pending");

    try {
      const response = await fetch(`/api/exams/${examId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adaptationId,
          rating,
          comment: comment.trim() ? comment.trim() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar feedback.");
      }

      setStatus("success");
      onFeedbackSubmit?.();
    } catch {
      setStatus("error");
    }
  }

  const displayStars = hoveredStar || rating;

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface-muted/30 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
          <legend className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Avalie esta adaptação
          </legend>

          <div className="flex items-center gap-1" onMouseLeave={() => setHoveredStar(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredStar(value)}
                aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
                className={cn(
                  "cursor-pointer p-0.5 transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:rounded",
                  "hover:scale-110 active:scale-95",
                )}
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors duration-150",
                    value <= displayStars
                      ? "fill-accent-400 text-accent-400"
                      : "fill-transparent text-text-muted",
                  )}
                />
              </button>
            ))}

            {rating > 0 ? (
              <span className="ml-2 text-xs font-medium text-text-muted">
                {rating}/5
              </span>
            ) : null}
          </div>
        </fieldset>

        <div className="flex items-center gap-2">
          {!showComment ? (
            <button
              type="button"
              onClick={() => setShowComment(true)}
              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-text-secondary"
            >
              <MessageSquare className="h-3 w-3" />
              Adicionar comentário
            </button>
          ) : null}
        </div>
      </div>

      {/* Comment Area */}
      {showComment ? (
        <div className="flex flex-col gap-1.5 animate-slide-down">
          <label
            htmlFor={`comment-${adaptationId}`}
            className="text-xs font-medium text-text-muted"
          >
            Comentário (opcional)
          </label>
          <textarea
            id={`comment-${adaptationId}`}
            className="w-full resize-none rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            onChange={(event) => setComment(event.target.value)}
            value={comment}
            rows={2}
            placeholder="O que pode melhorar nesta adaptação?"
          />
        </div>
      ) : null}

      {/* Submit Row */}
      <div className="flex items-center gap-3">
        <Button
          disabled={status === "pending" || rating === 0}
          type="submit"
          variant={status === "success" ? "primary" : "secondary"}
          size="sm"
        >
          {status === "pending" ? (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : status === "success" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {status === "success" ? "Salvo" : status === "pending" ? "Enviando..." : "Enviar feedback"}
        </Button>

        <span
          aria-live="polite"
          className={cn(
            "flex items-center gap-1 text-xs transition-opacity duration-200",
            status === "success" || status === "error" ? "opacity-100" : "opacity-0",
            status === "success" ? "text-brand-600" : "text-danger",
          )}
        >
          {status === "success" ? (
            <>
              <Check className="h-3 w-3" />
              Feedback salvo com sucesso.
            </>
          ) : null}
          {status === "error" ? (
            <>
              <AlertCircle className="h-3 w-3" />
              Erro ao salvar. Tente novamente.
            </>
          ) : null}
        </span>
      </div>
    </form>
  );
});
