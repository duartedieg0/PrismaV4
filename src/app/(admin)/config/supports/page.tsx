"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { Button } from "@/design-system/components/button";
import { LoadingState } from "@/design-system/components/loading-state";
import { EmptyState } from "@/design-system/components/empty-state";
import { StatusBadge } from "@/design-system/components/status-badge";
import type { AdminSupportView } from "@/features/admin/supports/contracts";
import type { SelectOption } from "@/features/admin/shared/contracts";

export default function AdminSupportsPage() {
  const [supports, setSupports] = useState<AdminSupportView[]>([]);
  const [agents, setAgents] = useState<SelectOption[]>([]);
  const [models, setModels] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    agentId: "",
    modelId: "",
    enabled: true,
  });

  async function loadData() {
    setIsLoading(true);

    try {
      const [supportsResponse, agentsResponse, modelsResponse] = await Promise.all([
        fetch("/api/admin/supports", { cache: "no-store" }),
        fetch("/api/admin/agents", { cache: "no-store" }),
        fetch("/api/admin/models", { cache: "no-store" }),
      ]);

      if (!supportsResponse.ok || !agentsResponse.ok || !modelsResponse.ok) {
        throw new Error("Não foi possível carregar apoios, agentes ou modelos.");
      }

      const [nextSupports, nextAgents, nextModels] = await Promise.all([
        supportsResponse.json() as Promise<AdminSupportView[]>,
        agentsResponse.json() as Promise<Array<{ id: string; name: string; enabled: boolean }>>,
        modelsResponse.json() as Promise<Array<{ id: string; name: string; enabled: boolean }>>,
      ]);

      setSupports(nextSupports);
      setAgents(nextAgents.filter((agent) => agent.enabled).map(({ id, name }) => ({ id, name })));
      setModels(nextModels.filter((model) => model.enabled).map(({ id, name }) => ({ id, name })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", agentId: "", modelId: "", enabled: true });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await fetch(
        editingId ? `/api/admin/supports/${editingId}` : "/api/admin/supports",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            agentId: form.agentId,
            modelId: form.modelId || null,
            enabled: form.enabled,
          }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar o apoio.");
      }

      toast.success(editingId ? "Apoio atualizado com sucesso." : "Apoio criado com sucesso.");
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar apoio.");
    }
  }

  async function handleDelete(supportId: string) {
    try {
      const response = await fetch(`/api/admin/supports/${supportId}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível excluir o apoio.");
      }

      toast.success("Apoio excluído com sucesso.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir apoio.");
    }
  }

  const inputClass = "rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

  return (
    <AdminShell
      title="Apoios"
      description="Vincule cada apoio a um agente e a um modelo habilitado."
      activeNav="supports"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Apoios", href: "/config/supports" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border-default bg-white p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text-primary">
              {editingId ? "Editar apoio" : "Novo apoio"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                aria-label="Nome do apoio"
                className={inputClass}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome do apoio"
                required
                value={form.name}
              />
              <select
                aria-label="Agente"
                className={inputClass}
                onChange={(event) => setForm((current) => ({ ...current, agentId: event.target.value }))}
                required
                value={form.agentId}
              >
                <option value="">Selecione um agente</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <select
                aria-label="Modelo"
                className={inputClass}
                onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))}
                value={form.modelId}
              >
                <option value="">Selecione um modelo</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                checked={form.enabled}
                className="h-4 w-4 rounded border-border-default text-brand-600 focus:ring-brand-200"
                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                type="checkbox"
              />
              Habilitado
            </label>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" size="sm">
                {editingId ? "Salvar alterações" : "Criar apoio"}
              </Button>
              {editingId ? (
                <Button onClick={resetForm} type="button" variant="ghost" size="sm">
                  Cancelar edição
                </Button>
              ) : null}
            </div>
          </form>
        </div>

        {isLoading ? <LoadingState message="Carregando apoios..." /> : null}
        {!isLoading && supports.length === 0 ? <EmptyState message="Nenhum apoio configurado ainda." /> : null}
        {!isLoading && supports.length > 0 ? (
          <div className="flex flex-col gap-3">
            {supports.map((support) => (
              <div
                key={support.id}
                className="flex flex-col gap-3 rounded-2xl border border-border-default bg-white p-5 transition-colors hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <strong className="text-sm font-semibold text-text-primary">{support.name}</strong>
                    <span className="text-sm text-text-secondary">Agente: {support.agentName ?? "—"}</span>
                    <span className="text-sm text-text-secondary">
                      Modelo: {support.modelName ? `${support.modelName} (${support.modelIdentifier})` : "—"}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      onClick={() => {
                        setEditingId(support.id);
                        setForm({
                          name: support.name,
                          agentId: support.agentId,
                          modelId: support.modelId ?? "",
                          enabled: support.enabled,
                        });
                      }}
                      type="button"
                      variant="outline"
                      size="sm"
                    >
                      Editar
                    </Button>
                    <Button onClick={() => void handleDelete(support.id)} type="button" variant="danger" size="sm">
                      Excluir
                    </Button>
                  </div>
                </div>
                <StatusBadge
                  label={support.enabled ? "Habilitado" : "Desabilitado"}
                  tone={support.enabled ? "default" : "secondary"}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
