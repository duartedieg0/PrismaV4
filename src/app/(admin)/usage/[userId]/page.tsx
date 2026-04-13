import { redirect } from "next/navigation";
import { requireAdminPageAccess } from "@/features/admin/shared/admin-guard";
import { createClient } from "@/gateways/supabase/server";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { UsageThreadsTable } from "@/features/admin/usage/components/usage-threads-table";
import { UsageExamsTable } from "@/features/admin/usage/components/usage-exams-table";
import { StatCard } from "@/design-system/components/stat-card";
import { MessageSquare, FileText, DollarSign } from "lucide-react";
import type { AdminUsageThread, AdminUsageExam } from "@/features/admin/usage/contracts";

async function loadUserUsage(userId: string) {
  const supabase = await createClient();

  const [profileResult, threadsResult, examUsageResult] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", userId).single(),
    supabase
      .from("consultant_threads")
      .select(
        "id, title, total_input_tokens, total_output_tokens, total_cache_read_tokens, total_cache_creation_tokens, estimated_cost_usd, updated_at",
      )
      .eq("teacher_id", userId)
      .not("managed_session_id", "is", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("exam_usage")
      .select("exam_id, stage, estimated_cost_usd, created_at, exams!inner(topic, status, user_id)")
      .eq("exams.user_id", userId),
  ]);

  const profile = profileResult.data as { full_name: string | null; email: string | null } | null;
  const rawThreads = threadsResult.data ?? [];

  const threads: AdminUsageThread[] = rawThreads.map((t) => ({
    threadId: t.id as string,
    title: t.title as string | null,
    inputTokens: (t.total_input_tokens as number) ?? 0,
    outputTokens: (t.total_output_tokens as number) ?? 0,
    cacheReadTokens: (t.total_cache_read_tokens as number) ?? 0,
    cacheCreationTokens: (t.total_cache_creation_tokens as number) ?? 0,
    estimatedCostUSD: (t.estimated_cost_usd as number) ?? 0,
    updatedAt: t.updated_at as string,
  }));

  const examMap = new Map<string, AdminUsageExam>();
  for (const eu of (examUsageResult.data ?? [])) {
    const exam = eu.exams as unknown as { topic: string | null; status: string; user_id: string } | null;
    if (!exam || exam.user_id !== userId) continue;

    if (!examMap.has(eu.exam_id)) {
      examMap.set(eu.exam_id, {
        examId: eu.exam_id,
        topic: exam.topic,
        status: exam.status,
        extractionCostUSD: 0,
        adaptationCostUSD: 0,
        totalCostUSD: 0,
        createdAt: eu.created_at as string,
      });
    }

    const e = examMap.get(eu.exam_id)!;
    const cost = (eu.estimated_cost_usd as number) ?? 0;
    if (eu.stage === "extraction") e.extractionCostUSD += cost;
    if (eu.stage === "adaptation") e.adaptationCostUSD += cost;
    e.totalCostUSD += cost;
  }

  const exams = [...examMap.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { profile, threads, exams };
}

type PageProps = { params: Promise<{ userId: string }> };

export default async function AdminUsageUserPage({ params }: PageProps) {
  const access = await requireAdminPageAccess();
  if (access.kind === "redirect") redirect(access.redirectTo);

  const { userId } = await params;
  const { profile, threads, exams } = await loadUserUsage(userId);

  const name = profile?.full_name ?? "Professor";
  const email = profile?.email ?? "";

  const threadsTotalCost = threads.reduce((s, t) => s + t.estimatedCostUSD, 0);
  const examsTotalCost = exams.reduce((s, e) => s + e.totalCostUSD, 0);
  const totalCost = threadsTotalCost + examsTotalCost;

  return (
    <AdminShell
      title={name}
      description={email || "Detalhamento de uso por sessão e prova."}
      activeNav="usage"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Usage", href: "/usage" },
        { label: name, href: `/usage/${userId}` },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Sessões"
            value={threads.length.toLocaleString("pt-BR")}
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <StatCard
            label="Provas"
            value={exams.length.toLocaleString("pt-BR")}
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            label="Custo total estimado"
            value={`$${totalCost.toFixed(4)}`}
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>

        <UsageThreadsTable threads={threads} />
        <UsageExamsTable exams={exams} />
      </div>
    </AdminShell>
  );
}
