import { withTeacherRoute } from "@/features/support/with-teacher-route";
import {
  apiSuccess,
  apiNotFound,
  apiError,
} from "@/services/errors/api-response";

export const GET = withTeacherRoute(async ({ supabase }, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  const { data: thread, error } = await supabase
    .from("consultant_threads")
    .select("id, agent_slug, title, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !thread) {
    return apiNotFound("Conversa não encontrada.");
  }

  return apiSuccess({ thread });
});

export const DELETE = withTeacherRoute(async ({ supabase }, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  // Verificar que a thread existe (RLS garante ownership)
  const { data: thread, error: fetchError } = await supabase
    .from("consultant_threads")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !thread) {
    return apiNotFound("Conversa não encontrada.");
  }

  // TODO: Deletar thread no Mastra Memory (LibSQL)
  // Quando @mastra/memory expuser um método de delete, adicionar aqui.
  // Por enquanto, as mensagens órfãs no LibSQL não causam problemas
  // pois são acessadas apenas via threadId.

  // Deletar metadata no Supabase
  const { error: deleteError } = await supabase
    .from("consultant_threads")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return apiError("INTERNAL_ERROR", "Erro ao deletar conversa.", 500);
  }

  return apiSuccess({ deleted: true });
});
