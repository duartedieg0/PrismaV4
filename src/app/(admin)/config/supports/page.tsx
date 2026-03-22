"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { LoadingState } from "@/design-system/components/loading-state";
import { EmptyState } from "@/design-system/components/empty-state";
import { StatusBadge } from "@/design-system/components/status-badge";
import { Surface } from "@/design-system/components/surface";
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
    setForm({
      name: "",
      agentId: "",
      modelId: "",
      enabled: true,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await fetch(
        editingId ? `/api/admin/supports/${editingId}` : "/api/admin/supports",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

  return (
    <AdminShell
      title="Apoios"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Apoios", href: "/config/supports" },
      ]}
    >
      <CatalogPage
        description="Vincule cada apoio a um agente e a um modelo habilitado."
        title="Apoios"
      >
        <Surface>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            <input
              aria-label="Nome do apoio"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nome do apoio"
              required
              value={form.name}
            />
            <select
              aria-label="Agente"
              onChange={(event) => setForm((current) => ({ ...current, agentId: event.target.value }))}
              required
              value={form.agentId}
            >
              <option value="">Selecione um agente</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Modelo"
              onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))}
              value={form.modelId}
            >
              <option value="">Selecione um modelo</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <label>
              <input
                checked={form.enabled}
                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                type="checkbox"
              />
              Habilitado
            </label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit">{editingId ? "Salvar alterações" : "Criar apoio"}</button>
              {editingId ? <button onClick={resetForm} type="button">Cancelar edição</button> : null}
            </div>
          </form>
        </Surface>

        {isLoading ? <LoadingState message="Carregando apoios..." /> : null}
        {!isLoading && supports.length === 0 ? <EmptyState message="Nenhum apoio configurado ainda." /> : null}
        {!isLoading && supports.length > 0 ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {supports.map((support) => (
              <Surface key={support.id}>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <strong>{support.name}</strong>
                  <span>Agente: {support.agentName ?? "—"}</span>
                  <span>Modelo: {support.modelName ? `${support.modelName} (${support.modelIdentifier})` : "—"}</span>
                  <StatusBadge
                    label={support.enabled ? "Habilitado" : "Desabilitado"}
                    tone={support.enabled ? "default" : "secondary"}
                  />
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
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
                    >
                      Editar
                    </button>
                    <button onClick={() => void handleDelete(support.id)} type="button">
                      Excluir
                    </button>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        ) : null}
      </CatalogPage>
    </AdminShell>
  );
}
