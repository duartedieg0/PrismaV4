"use client";

import { useState } from "react";

type CopyActionBarProps = {
  examId: string;
  adaptationId?: string;
  supportId?: string;
  text: string;
  onCopy?: (text: string) => Promise<void> | void;
};

export function CopyActionBar({
  examId,
  adaptationId,
  supportId,
  text,
  onCopy,
}: CopyActionBarProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      if (onCopy) {
        await onCopy(text);
      } else {
        await navigator.clipboard.writeText(text);
      }

      void fetch(`/api/exams/${examId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "adaptation_copied",
          adaptationId,
          supportId,
          copiedTextLength: text.length,
        }),
      });

      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
      <button onClick={handleCopy} type="button">
        Copiar adaptação
      </button>
      <span aria-live="polite" style={{ color: "var(--color-text-muted)" }}>
        {status === "copied" ? "Conteúdo copiado." : null}
        {status === "error" ? "Não foi possível copiar agora." : null}
      </span>
    </div>
  );
}
