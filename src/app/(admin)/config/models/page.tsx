"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { LoadingState } from "@/design-system/components/loading-state";
import { EmptyState } from "@/design-system/components/empty-state";
import { Surface } from "@/design-system/components/surface";
import { StatusBadge } from "@/design-system/components/status-badge";
import type { AdminModelView } from "@/features/admin/models/contracts";

export default function AdminModelsPage() {
  const [models, setModels] = useState<AdminModelView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    provider: "openai",
    baseUrl: "",
    apiKey: "",
    modelId: "",
    systemRole: "",
    enabled: true,
    isDefault: false,
  });

  async function loadModels() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/models", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Não foi possível carregar modelos.");
      }

      setModels(await response.json() as AdminModelView[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar modelos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadModels();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      provider: "openai",
      baseUrl: "",
      apiKey: "",
      modelId: "",
      systemRole: "",
      enabled: true,
      isDefault: false,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await fetch(
        editingId ? `/api/admin/models/${editingId}` : "/api/admin/models",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            provider: form.provider,
            baseUrl: form.baseUrl,
            apiKey: form.apiKey.trim() ? form.apiKey : undefined,
            modelId: form.modelId,
            systemRole: form.systemRole.trim() ? form.systemRole : null,
            enabled: form.enabled,
            isDefault: form.isDefault,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Não foi possível salvar o modelo.");
      }

      toast.success(editingId ? "Modelo atualizado com sucesso." : "Modelo criado com sucesso.");
      resetForm();
      await loadModels();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar modelo.");
    }
  }

  async function handleDelete(modelId: string) {
    try {
      const response = await fetch(`/api/admin/models/${modelId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Não foi possível excluir o modelo.");
      }

      toast.success("Modelo excluído com sucesso.");
      await loadModels();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir modelo.");
    }
  }

  return (
    <AdminShell
      title="Modelos"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Modelos", href: "/config/models" },
      ]}
    >
      <CatalogPage
        description="Gerencie providers, segredos mascarados, modelo padrão e papel operacional."
        title="Modelos de IA"
      >
        <Surface>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            <input
              aria-label="Nome do modelo"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nome do modelo"
              required
              value={form.name}
            />
            <input
              aria-label="Provider"
              onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
              placeholder="Provider"
              required
              value={form.provider}
            />
            <input
              aria-label="Base URL"
              onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))}
              placeholder="Base URL"
              required
              value={form.baseUrl}
            />
            <input
              aria-label="Model ID"
              onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))}
              placeholder="Model ID"
              required
              value={form.modelId}
            />
            <input
              aria-label="Secret key"
              onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
              placeholder={editingId ? "Nova secret key (opcional)" : "Secret key"}
              value={form.apiKey}
            />
            <input
              aria-label="Papel do sistema"
              onChange={(event) => setForm((current) => ({ ...current, systemRole: event.target.value }))}
              placeholder="Papel do sistema"
              value={form.systemRole}
            />
            <label>
              <input
                checked={form.enabled}
                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                type="checkbox"
              />
              Habilitado
            </label>
            <label>
              <input
                checked={form.isDefault}
                onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
                type="checkbox"
              />
              Modelo padrão
            </label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit">{editingId ? "Salvar alterações" : "Criar modelo"}</button>
              {editingId ? <button onClick={resetForm} type="button">Cancelar edição</button> : null}
            </div>
          </form>
        </Surface>

        {isLoading ? <LoadingState message="Carregando modelos..." /> : null}
        {!isLoading && models.length === 0 ? <EmptyState message="Nenhum modelo configurado ainda." /> : null}
        {!isLoading && models.length > 0 ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {models.map((model) => (
              <Surface key={model.id}>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <strong>{model.name}</strong>
                  <span>{model.provider} / {model.modelId}</span>
                  <span>{model.baseUrl}</span>
                  <span>{model.apiKeyMasked}</span>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <StatusBadge label={model.enabled ? "Habilitado" : "Desabilitado"} tone={model.enabled ? "default" : "secondary"} />
                    {model.isDefault ? <StatusBadge label="Padrão" tone="outline" /> : null}
                    {model.systemRole ? <StatusBadge label={model.systemRole} tone="outline" /> : null}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => {
                        setEditingId(model.id);
                        setForm({
                          name: model.name,
                          provider: model.provider,
                          baseUrl: model.baseUrl,
                          apiKey: "",
                          modelId: model.modelId,
                          systemRole: model.systemRole ?? "",
                          enabled: model.enabled,
                          isDefault: model.isDefault,
                        });
                      }}
                      type="button"
                    >
                      Editar
                    </button>
                    <button onClick={() => void handleDelete(model.id)} type="button">
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
