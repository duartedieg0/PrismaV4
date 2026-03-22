"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Surface } from "@/design-system/components/surface";

type AgentFormProps = {
  mode: "create" | "edit";
  agentId?: string;
  initialValues?: {
    name: string;
    objective: string;
    prompt: string;
    enabled: boolean;
  };
};

export function AgentForm({ mode, agentId, initialValues }: AgentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [objective, setObjective] = useState(initialValues?.objective ?? "");
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? "");
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        mode === "create" ? "/api/admin/agents" : `/api/admin/agents/${agentId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            objective: objective.trim() ? objective.trim() : undefined,
            prompt,
            enabled,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Não foi possível salvar o agente.");
      }

      toast.success(mode === "create" ? "Agente criado com sucesso." : "Agente atualizado com sucesso.");
      router.push("/config/agents");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar agente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Surface padding="1.25rem">
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <strong>{mode === "create" ? "Novo agente" : "Editar agente"}</strong>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Defina objetivo, prompt e estado operacional dentro do runtime administrativo.
          </p>
        </div>
        <label htmlFor="agent-name">Nome</label>
        <input id="agent-name" onChange={(event) => setName(event.target.value)} required value={name} />

        <label htmlFor="agent-objective">Objetivo</label>
        <textarea
          id="agent-objective"
          onChange={(event) => setObjective(event.target.value)}
          value={objective}
        />

        <label htmlFor="agent-prompt">Prompt</label>
        <textarea
          id="agent-prompt"
          onChange={(event) => setPrompt(event.target.value)}
          required
          rows={16}
          value={prompt}
        />

        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          Agente habilitado
        </label>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button disabled={isSubmitting} type="submit">
            {mode === "create" ? "Criar agente" : "Salvar alterações"}
          </button>
          <button
            onClick={() => router.push("/config/agents")}
            type="button"
            style={{
              background: "rgba(248,250,252,0.95)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "none",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </Surface>
  );
}
