"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/design-system/components/button";

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

const inputClass = "w-full rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

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
          headers: { "Content-Type": "application/json" },
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
    <div className="rounded-2xl border border-border-default bg-white p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <strong className="text-sm font-semibold text-text-primary">
            {mode === "create" ? "Novo agente" : "Editar agente"}
          </strong>
          <p className="text-sm text-text-secondary">
            Defina objetivo, prompt e estado operacional dentro do runtime administrativo.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-name" className="text-sm font-semibold text-text-primary">Nome</label>
          <input id="agent-name" className={inputClass} onChange={(event) => setName(event.target.value)} required value={name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-objective" className="text-sm font-semibold text-text-primary">Objetivo</label>
          <textarea id="agent-objective" className={inputClass} onChange={(event) => setObjective(event.target.value)} value={objective} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-prompt" className="text-sm font-semibold text-text-primary">Prompt</label>
          <textarea id="agent-prompt" className={inputClass} onChange={(event) => setPrompt(event.target.value)} required rows={16} value={prompt} />
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            checked={enabled}
            className="h-4 w-4 rounded border-border-default text-brand-600 focus:ring-brand-200"
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          Agente habilitado
        </label>

        <div className="flex flex-wrap gap-3">
          <Button disabled={isSubmitting} type="submit" variant="primary" size="sm">
            {mode === "create" ? "Criar agente" : "Salvar alterações"}
          </Button>
          <Button onClick={() => router.push("/config/agents")} type="button" variant="ghost" size="sm">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
