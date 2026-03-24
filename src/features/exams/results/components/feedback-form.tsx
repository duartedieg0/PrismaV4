"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/design-system/components/button";

type FeedbackFormProps = {
  examId: string;
  adaptationId: string;
  existingFeedback?: {
    rating: number;
    comment: string | null;
  } | null;
};

export function FeedbackForm({
  examId,
  adaptationId,
  existingFeedback,
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(existingFeedback?.rating ?? 0);
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-border-default pt-4">
      <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
        <legend className="mb-1 text-sm font-semibold text-text-primary">Avaliação</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className={cn(
                "flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-all duration-200",
                rating === value
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-border-default bg-white text-text-secondary hover:border-border-strong",
              )}
            >
              <input
                checked={rating === value}
                name={`rating-${adaptationId}`}
                onChange={() => setRating(value)}
                type="radio"
                value={value}
                className="h-3.5 w-3.5 border-border-default text-brand-600 focus:ring-brand-200"
              />
              {value} estrelas
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`comment-${adaptationId}`} className="text-sm font-semibold text-text-primary">
          Comentário
        </label>
        <textarea
          id={`comment-${adaptationId}`}
          className="w-full rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          onChange={(event) => setComment(event.target.value)}
          value={comment}
          rows={2}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button disabled={status === "pending"} type="submit" variant="secondary" size="sm">
          Enviar feedback
        </Button>
        <span aria-live="polite" className="text-xs text-text-secondary">
          {status === "success" ? "Feedback salvo." : null}
          {status === "error" ? "Erro ao salvar feedback." : null}
        </span>
      </div>
    </form>
  );
}
