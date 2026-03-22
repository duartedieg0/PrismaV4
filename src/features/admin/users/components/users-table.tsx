"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";
import { StatusBadge } from "@/design-system/components/status-badge";
import { Surface } from "@/design-system/components/surface";
import { UserGovernanceDialog } from "@/features/admin/users/components/user-governance-dialog";
import type { AdminUserListItem } from "@/features/admin/users/contracts";

type PendingAction =
  | {
      user: AdminUserListItem;
      type: "block" | "unblock" | "promote" | "demote";
    }
  | null;

type UsersTableProps = {
  initialUsers: AdminUserListItem[];
};

export function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [users],
  );

  async function applyAction() {
    if (!pendingAction) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload =
        pendingAction.type === "block"
          ? { blocked: true }
          : pendingAction.type === "unblock"
            ? { blocked: false }
            : pendingAction.type === "promote"
              ? { role: "admin" }
              : { role: "teacher" };

      const response = await fetch(`/api/admin/users/${pendingAction.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null) as AdminUserListItem | { error?: string } | null;

      if (!response.ok || !result) {
        throw new Error("Erro ao atualizar usuário.");
      }

      if ("error" in result) {
        throw new Error(result.error ?? "Erro ao atualizar usuário.");
      }

      const updatedUser = result as AdminUserListItem;

      setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      toast.success("Usuário atualizado com sucesso.");
      setPendingAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar usuário.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function describePendingAction() {
    if (!pendingAction) {
      return null;
    }

    const userName = pendingAction.user.fullName ?? pendingAction.user.email ?? "este usuário";

    switch (pendingAction.type) {
      case "block":
        return {
          title: "Bloquear usuário",
          description: `Tem certeza que deseja bloquear "${userName}"? O acesso será interrompido nas rotas protegidas.`,
          confirmLabel: "Bloquear",
          tone: "destructive" as const,
        };
      case "unblock":
        return {
          title: "Desbloquear usuário",
          description: `Tem certeza que deseja desbloquear "${userName}"? O acesso normal será restaurado.`,
          confirmLabel: "Desbloquear",
          tone: "default" as const,
        };
      case "promote":
        return {
          title: "Promover usuário",
          description: `Tem certeza que deseja promover "${userName}" para administrador?`,
          confirmLabel: "Promover",
          tone: "default" as const,
        };
      case "demote":
        return {
          title: "Rebaixar administrador",
          description: `Tem certeza que deseja rebaixar "${userName}" para professor?`,
          confirmLabel: "Rebaixar",
          tone: "destructive" as const,
        };
      default:
        return null;
    }
  }

  const dialogConfig = describePendingAction();

  if (!initialUsers) {
    return <LoadingState message="Carregando usuários..." />;
  }

  if (sortedUsers.length === 0) {
    return <EmptyState message="Nenhum usuário registrado ainda." />;
  }

  return (
    <>
      <Surface padding="1.25rem">
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              <strong>Usuários da plataforma</strong>
              <span style={{ color: "var(--color-text-muted)" }}>
                Bloqueio, desbloqueio e mudança de papel com auditoria persistida.
              </span>
            </div>
            <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono), monospace" }}>
              {sortedUsers.length} registros
            </span>
          </div>
          <table>
          <thead>
            <tr>
              <th align="left">Nome</th>
              <th align="left">E-mail</th>
              <th align="left">Papel</th>
              <th align="left">Status</th>
              <th align="left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName ?? "—"}</td>
                <td>{user.email ?? "—"}</td>
                <td>
                  <StatusBadge label={user.role === "admin" ? "Admin" : "Professor"} tone={user.role === "admin" ? "outline" : "secondary"} />
                </td>
                <td>
                  <StatusBadge
                    label={user.blocked ? "Bloqueado" : "Ativo"}
                    tone={user.blocked ? "destructive" : "default"}
                  />
                </td>
                <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setPendingAction({ user, type: user.blocked ? "unblock" : "block" })}
                    type="button"
                  >
                    {user.blocked ? "Desbloquear" : "Bloquear"}
                  </button>
                  <button
                    onClick={() => setPendingAction({ user, type: user.role === "admin" ? "demote" : "promote" })}
                    type="button"
                  >
                    {user.role === "admin" ? "Tornar professor" : "Tornar admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </Surface>

      {dialogConfig ? (
        <UserGovernanceDialog
          confirmLabel={dialogConfig.confirmLabel}
          description={dialogConfig.description}
          isOpen={Boolean(pendingAction)}
          isPending={isSubmitting}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => void applyAction()}
          title={dialogConfig.title}
          tone={dialogConfig.tone}
        />
      ) : null}
    </>
  );
}
