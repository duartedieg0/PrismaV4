"use client";

import { useEffect, useState } from "react";
import { Copy, Check, AlertCircle, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/design-system/components/button";

type CopyActionBarProps = {
  examId: string;
  adaptationId?: string;
  supportId?: string;
  text: string;
  onCopy?: (text: string) => Promise<void> | void;
  onCopySuccess?: () => void;       // new — called after successful copy
  showFeedbackNudge?: boolean;      // new — will be used in Task 3
  onNudgeClose?: () => void;        // new — will be used in Task 3
  onScrollToFeedback?: () => void;  // new — will be used in Task 3
};

export function CopyActionBar({
  examId,
  adaptationId,
  supportId,
  text,
  onCopy,
  onCopySuccess,
  showFeedbackNudge,
  onNudgeClose,
  onScrollToFeedback,
}: CopyActionBarProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (!showFeedbackNudge) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onNudgeClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showFeedbackNudge, onNudgeClose]);

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
      onCopySuccess?.();                         // ← new
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-border-default bg-surface-muted/50 px-4 py-3">
      {/* Popover de nudge */}
      {showFeedbackNudge ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Avaliar adaptação"
          aria-describedby={`nudge-text-${adaptationId}`}
          className={cn(
            "absolute bottom-full left-0 mb-2 z-10",
            "w-full max-w-sm rounded-xl border border-border-default",
            "bg-white px-4 py-3 shadow-md",
            "flex items-start justify-between gap-3",
          )}
        >
          <p
            id={`nudge-text-${adaptationId}`}
            className="text-sm text-text-primary"
          >
            Gostou desta adaptação? Seu feedback ajuda a melhorar as próximas.
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onScrollToFeedback}
              className="gap-1"
            >
              Avaliar
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              onClick={onNudgeClose}
              aria-label="Fechar"
              className="rounded p-1 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      <Button
        onClick={handleCopy}
        type="button"
        variant={status === "copied" ? "primary" : status === "error" ? "danger" : "outline"}
        size="sm"
        className="transition-all duration-200"
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
