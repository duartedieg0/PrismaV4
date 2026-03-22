"use client";

import { useRef } from "react";
import { InlineError } from "@/design-system/components/inline-error";

type PdfDropzoneProps = Readonly<{
  file: File | null;
  errorMessage?: string;
  onChange(file: File | null): void;
  disabled?: boolean;
}>;

export function PdfDropzone({
  file,
  errorMessage,
  onChange,
  disabled = false,
}: PdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <label htmlFor="uploaded-pdf" style={{ fontWeight: 600 }}>
        Arquivo PDF
      </label>
      <input
        ref={inputRef}
        id="uploaded-pdf"
        name="uploaded-pdf"
        type="file"
        accept="application/pdf"
        disabled={disabled}
        aria-describedby={errorMessage ? "uploaded-pdf-error" : undefined}
        onChange={(event) => {
          onChange(event.currentTarget.files?.[0] ?? null);
        }}
        style={{ padding: "1.1rem", borderStyle: "dashed", background: "rgba(248,250,252,0.9)" }}
      />
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Apenas arquivos PDF com até 25 MB.
      </p>
      {file ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "1rem",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-card)",
            background: "var(--color-surface-subtle)",
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>{file.name}</p>
            <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)" }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = "";
              }

              onChange(null);
            }}
            disabled={disabled}
          >
            Remover arquivo
          </button>
        </div>
      ) : null}
      {errorMessage ? <div id="uploaded-pdf-error"><InlineError message={errorMessage} /></div> : null}
    </div>
  );
}
