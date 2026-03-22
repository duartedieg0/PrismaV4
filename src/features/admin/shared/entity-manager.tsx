"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";
import { StatusBadge } from "@/design-system/components/status-badge";
import { Surface } from "@/design-system/components/surface";
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

      const nextItems = await response.json() as EnabledNameEntity[];
      setItems(nextItems);
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
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
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
    <div style={{ display: "grid", gap: "1rem" }}>
      <Surface padding="1.25rem">
        <form
          onSubmit={handleCreate}
          style={{ display: "grid", gap: "0.75rem", alignItems: "end" }}
        >
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <strong>Novo {singularLabel.toLowerCase()}</strong>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
              Cadastre itens do catálogo e mantenha o fluxo do professor alinhado com o runtime.
            </p>
          </div>
          <label htmlFor={`${apiPath}-name`}>Nome</label>
          <input
            id={`${apiPath}-name`}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <button disabled={isSubmitting} type="submit">
            Criar {singularLabel.toLowerCase()}
          </button>
        </form>
      </Surface>

      <Surface padding="1.25rem">
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
                    <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button onClick={() => void handleToggle(item)} type="button">
                        {item.enabled ? "Desabilitar" : "Habilitar"}
                      </button>
                      <button onClick={() => void handleDelete(item)} type="button">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableWrapper>
        ) : null}
      </Surface>
    </div>
  );
}
