"use client";

import { useState } from "react";

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
        headers: {
          "Content-Type": "application/json",
        },
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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.9rem" }}>
      <fieldset style={{ display: "grid", gap: "0.6rem", border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Avaliação</legend>
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <input
              checked={rating === value}
              name={`rating-${adaptationId}`}
              onChange={() => setRating(value)}
              type="radio"
              value={value}
            />
            {value} estrelas
          </label>
        ))}
      </fieldset>

      <label htmlFor={`comment-${adaptationId}`}>Comentário</label>
      <textarea
        id={`comment-${adaptationId}`}
        onChange={(event) => setComment(event.target.value)}
        value={comment}
      />

      <button disabled={status === "pending"} type="submit">
        Enviar feedback
      </button>

      <span aria-live="polite" style={{ color: "var(--color-text-muted)" }}>
        {status === "success" ? "Feedback salvo." : null}
        {status === "error" ? "Erro ao salvar feedback." : null}
      </span>
    </form>
  );
}
