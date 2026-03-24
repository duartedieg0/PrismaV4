"use client";

import { useRef } from "react";
import { Button } from "@/design-system/components/button";
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
    <div className="flex flex-col gap-3">
      <label htmlFor="uploaded-pdf" className="text-sm font-semibold text-text-primary">
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
        className="rounded-xl border border-dashed border-border-default bg-surface-muted/50 px-4 py-4 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-600"
      />
      <p className="text-xs text-text-secondary">
        Apenas arquivos PDF com até 25 MB.
      </p>
      {file ? (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border-default bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-text-primary">{file.name}</p>
            <p className="text-xs text-text-secondary">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = "";
              }
              onChange(null);
            }}
            disabled={disabled}
          >
            Remover arquivo
          </Button>
        </div>
      ) : null}
      {errorMessage ? <div id="uploaded-pdf-error"><InlineError message={errorMessage} /></div> : null}
    </div>
  );
}
