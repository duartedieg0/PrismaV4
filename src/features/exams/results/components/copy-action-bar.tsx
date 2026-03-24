"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-muted/50 px-4 py-3">
      <Button
        onClick={handleCopy}
        type="button"
        variant={status === "copied" ? "primary" : "outline"}
        size="sm"
        className={cn(
          "transition-all duration-200",
          status === "copied" && "bg-brand-600",
        )}
      >
        {status === "copied" ? (
          <Check className="h-3.5 w-3.5" />
        ) : status === "error" ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {status === "copied" ? "Copiado!" : status === "error" ? "Erro" : "Copiar adaptação"}
      </Button>

      <span
        aria-live="polite"
        className={cn(
          "text-xs transition-opacity duration-200",
          status === "idle" ? "opacity-0" : "opacity-100",
          status === "copied" ? "text-brand-600" : "text-danger",
        )}
      >
        {status === "copied" ? "Conteúdo copiado para a área de transferência." : null}
        {status === "error" ? "Não foi possível copiar. Tente novamente." : null}
      </span>
    </div>
  );
}
