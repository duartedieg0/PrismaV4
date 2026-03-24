"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/design-system/components/button";
import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";
import { StatusBadge } from "@/design-system/components/status-badge";
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null) as { data?: AdminUserListItem; error?: { message?: string } } | null;

      if (!response.ok || !body) {
        throw new Error(body?.error?.message ?? "Erro ao atualizar usuário.");
      }

      if (body.error) {
        throw new Error(body.error.message ?? "Erro ao atualizar usuário.");
      }

      const updatedUser = body.data as AdminUserListItem;

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
      <div className="rounded-2xl border border-border-default bg-white p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <strong className="text-sm font-semibold text-text-primary">Usuários da plataforma</strong>
              <span className="text-sm text-text-secondary">
                Bloqueio, desbloqueio e mudança de papel com auditoria persistida.
              </span>
            </div>
            <span className="font-mono text-xs text-text-secondary">
              {sortedUsers.length} registros
            </span>
          </div>
          <DataTableWrapper>
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
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => setPendingAction({ user, type: user.blocked ? "unblock" : "block" })}
                          type="button"
                          variant={user.blocked ? "secondary" : "outline"}
                          size="sm"
                        >
                          {user.blocked ? "Desbloquear" : "Bloquear"}
                        </Button>
                        <Button
                          onClick={() => setPendingAction({ user, type: user.role === "admin" ? "demote" : "promote" })}
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          {user.role === "admin" ? "Tornar professor" : "Tornar admin"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableWrapper>
        </div>
      </div>

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
