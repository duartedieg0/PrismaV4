import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { getConsultantBackend } from "@/features/support/consultant-backend";
import { mastraStreamMessage, mastraGetMessages } from "@/features/support/thread-handlers-mastra";

export const maxDuration = 300; // aumentado de 60 — Managed pode levar mais por memory_search

export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    // Implementado na Task 7
    return new Response("Managed backend não implementado ainda", { status: 501 });
  }
  return mastraStreamMessage(ctx, req);
});

export const GET = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    // Implementado na Task 6
    return new Response("Managed backend não implementado ainda", { status: 501 });
  }
  return mastraGetMessages(ctx, req);
});
