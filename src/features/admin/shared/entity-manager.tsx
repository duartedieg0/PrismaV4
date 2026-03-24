"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/design-system/components/button";
import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";
import { StatusBadge } from "@/design-system/components/status-badge";
import type { EnabledNameEntity } from "@/features/admin/shared/contracts";

type EntityManagerProps = {
  apiPath: string;
  singularLabel: string;
  pluralLabel: string;
};

export function EntityManager({
  apiPath,
  singularLabel,
  pluralLabel,
}: EntityManagerProps) {
  const [items, setItems] = useState<EnabledNameEntity[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(apiPath, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Não foi possível carregar ${pluralLabel.toLowerCase()}.`);
      }

      const body = await response.json();
      setItems(body.data as EnabledNameEntity[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar catálogo.");
    } finally {
      setIsLoading(false);
    }
  }, [apiPath, pluralLabel]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`Não foi possível criar ${singularLabel.toLowerCase()}.`);
      }

      setName("");
      toast.success(`${singularLabel} criado com sucesso.`);
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(item: EnabledNameEntity) {
    try {
      const response = await fetch(`${apiPath}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !item.enabled }),
      });

      if (!response.ok) {
        throw new Error(`Não foi possível atualizar ${singularLabel.toLowerCase()}.`);
      }

      toast.success(`${singularLabel} atualizado com sucesso.`);
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar.");
    }
  }

  async function handleDelete(item: EnabledNameEntity) {
    try {
      const response = await fetch(`${apiPath}/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Não foi possível excluir ${singularLabel.toLowerCase()}.`);
      }

      toast.success(`${singularLabel} excluído com sucesso.`);
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border-default bg-white p-5">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <strong className="text-sm font-semibold text-text-primary">Novo {singularLabel.toLowerCase()}</strong>
            <p className="text-sm text-text-secondary">
              Cadastre itens do catálogo e mantenha o fluxo do professor alinhado com o runtime.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${apiPath}-name`} className="text-sm font-semibold text-text-primary">Nome</label>
            <input
              id={`${apiPath}-name`}
              className="w-full rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
          <div>
            <Button disabled={isSubmitting} type="submit" variant="primary" size="sm">
              Criar {singularLabel.toLowerCase()}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-border-default bg-white p-5">
        {isLoading ? <LoadingState message={`Carregando ${pluralLabel.toLowerCase()}...`} /> : null}
        {!isLoading && items.length === 0 ? (
          <EmptyState message={`Nenhum ${singularLabel.toLowerCase()} configurado ainda.`} />
        ) : null}
        {!isLoading && items.length > 0 ? (
          <DataTableWrapper>
            <table>
              <thead>
                <tr>
                  <th align="left">Nome</th>
                  <th align="left">Status</th>
                  <th align="left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>
                      <StatusBadge
                        label={item.enabled ? "Habilitado" : "Desabilitado"}
                        tone={item.enabled ? "default" : "secondary"}
                      />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void handleToggle(item)} type="button" variant="outline" size="sm">
                          {item.enabled ? "Desabilitar" : "Habilitar"}
                        </Button>
                        <Button onClick={() => void handleDelete(item)} type="button" variant="danger" size="sm">
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableWrapper>
        ) : null}
      </div>
    </div>
  );
}
