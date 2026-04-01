"use client";

import { useRef } from "react";
import { Send } from "lucide-react";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled: boolean;
};

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;

    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border-default bg-white p-2">
      <textarea
        ref={textareaRef}
        placeholder="Digite sua mensagem..."
        rows={1}
        maxLength={2000}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        aria-label="Enviar mensagem"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
