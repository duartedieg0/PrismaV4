"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/design-system/components/button";

interface ThreadItem {
  id: string;
  title: string | null;
  updated_at: string;
}

export function ThreadList({ agentSlug }: { agentSlug: string }) {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/teacher/threads?agentSlug=${agentSlug}`,
    );
    const json = await res.json();
    setThreads(json.data?.threads ?? []);
    setLoading(false);
  }, [agentSlug]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  async function createThread() {
    setCreating(true);
    const res = await fetch("/api/teacher/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentSlug }),
    });
    const json = await res.json();
    if (json.data?.threadId) {
      window.location.href = `/support/${agentSlug}/${json.data.threadId}`;
    }
    setCreating(false);
  }

  async function deleteThread(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta conversa?")) return;

    await fetch(`/api/teacher/threads/${id}`, { method: "DELETE" });
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-secondary">
        Carregando conversas...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          variant="accent"
          size="md"
          onClick={createThread}
          disabled={creating}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {creating ? "Criando..." : "Nova conversa"}
        </Button>
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-default py-16 text-center">
          <MessageCircle className="h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-secondary">
            Nenhuma conversa ainda. Clique em "Nova conversa" para começar.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="flex items-center justify-between rounded-xl border border-border-default bg-white px-4 py-3 transition-colors hover:border-brand-200"
            >
              <Link
                href={`/support/${agentSlug}/${thread.id}`}
                className="flex-1"
              >
                <p className="text-sm font-medium text-text-primary">
                  {thread.title ?? "Conversa sem título"}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(thread.updated_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Link>
              <button
                onClick={() => deleteThread(thread.id)}
                className="ml-3 rounded-lg p-2 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Excluir conversa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
