"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { Button } from "@/design-system/components/button";
import { LoadingState } from "@/design-system/components/loading-state";
import { EmptyState } from "@/design-system/components/empty-state";
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

      const body = await response.json();
      setModels(body.data as AdminModelView[]);
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
          headers: { "Content-Type": "application/json" },
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
      description="Gerencie providers, segredos mascarados, modelo padrão e papel operacional."
      activeNav="models"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Modelos", href: "/config/models" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border-default bg-white p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text-primary">
              {editingId ? "Editar modelo" : "Novo modelo"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                aria-label="Nome do modelo"
                className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome do modelo"
                required
                value={form.name}
              />
              <input
                aria-label="Provider"
                className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
                placeholder="Provider"
                required
                value={form.provider}
              />
              <input
                aria-label="Base URL"
                className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))}
                placeholder="Base URL"
                required
                value={form.baseUrl}
              />
              <input
                aria-label="Model ID"
                className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))}
                placeholder="Model ID"
                required
                value={form.modelId}
              />
              <input
                aria-label="Secret key"
                className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
                placeholder={editingId ? "Nova secret key (opcional)" : "Secret key"}
                value={form.apiKey}
              />
              <input
                aria-label="Papel do sistema"
                className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setForm((current) => ({ ...current, systemRole: event.target.value }))}
                placeholder="Papel do sistema"
                value={form.systemRole}
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  checked={form.enabled}
                  className="h-4 w-4 rounded border-border-default text-brand-600 focus:ring-brand-200"
                  onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                  type="checkbox"
                />
                Habilitado
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  checked={form.isDefault}
                  className="h-4 w-4 rounded border-border-default text-brand-600 focus:ring-brand-200"
                  onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
                  type="checkbox"
                />
                Modelo padrão
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" size="sm">
                {editingId ? "Salvar alterações" : "Criar modelo"}
              </Button>
              {editingId ? (
                <Button onClick={resetForm} type="button" variant="ghost" size="sm">
                  Cancelar edição
                </Button>
              ) : null}
            </div>
          </form>
        </div>

        {isLoading ? <LoadingState message="Carregando modelos..." /> : null}
        {!isLoading && models.length === 0 ? <EmptyState message="Nenhum modelo configurado ainda." /> : null}
        {!isLoading && models.length > 0 ? (
          <div className="flex flex-col gap-3">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex flex-col gap-3 rounded-2xl border border-border-default bg-white p-5 transition-colors hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <strong className="text-sm font-semibold text-text-primary">{model.name}</strong>
                    <span className="text-sm text-text-secondary">
                      {model.provider} / {model.modelId}
                    </span>
                    <span className="text-xs text-text-secondary">{model.baseUrl}</span>
                    <span className="text-xs text-text-secondary">{model.apiKeyMasked}</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
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
                      variant="outline"
                      size="sm"
                    >
                      Editar
                    </Button>
                    <Button onClick={() => void handleDelete(model.id)} type="button" variant="danger" size="sm">
                      Excluir
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={model.enabled ? "Habilitado" : "Desabilitado"} tone={model.enabled ? "default" : "secondary"} />
                  {model.isDefault ? <StatusBadge label="Padrao" tone="outline" /> : null}
                  {model.systemRole ? <StatusBadge label={model.systemRole} tone="outline" /> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
