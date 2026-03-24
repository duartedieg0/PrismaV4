"use client";

import { useState } from "react";
import { Button } from "@/design-system/components/button";

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
        headers: { "Content-Type": "application/json" },
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
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={handleCopy} type="button" variant="outline" size="sm">
        Copiar adaptação
      </Button>
      <span aria-live="polite" className="text-xs text-text-secondary">
        {status === "copied" ? "Conteúdo copiado." : null}
        {status === "error" ? "Não foi possível copiar agora." : null}
      </span>
    </div>
  );
}
