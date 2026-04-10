import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeacherContext } from "./with-teacher-route";
import type { TeaConsultantGateway } from "@/gateways/managed-agents";
import type { ManagedSession } from "@/gateways/managed-agents";

// Helpers
function makeCtx(overrides?: {
  threadRow?: Record<string, unknown> | null;
  threadError?: unknown;
  insertedId?: string;
  insertError?: unknown;
}): TeacherContext {
  const threadRow = overrides?.threadRow !== undefined
    ? overrides.threadRow
    : { id: "thread-abc", title: null, managed_session_id: "sess_01", agent_slug: "tea-consultant" };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "consultant_threads") {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            overrides?.threadError
              ? { data: null, error: overrides.threadError }
              : { data: threadRow, error: null }
          ),
        };
      }
      if (table === "ai_models") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{
              id: "m1", name: "Model", provider: "openai",
              model_id: "gpt-4", base_url: "https://api.openai.com/v1",
              api_key: "sk-test", enabled: true, is_default: true,
            }],
            error: null,
          }),
        };
      }
      return {};
    }),
  } as unknown as SupabaseClient;

  return { supabase, userId: "user-xyz" };
}

function makeGateway(overrides?: Partial<TeaConsultantGateway>): TeaConsultantGateway {
  return {
    createSession: vi.fn().mockResolvedValue({
      id: "sess_01",
      agentId: "agent_01",
      createdAt: "2026-04-10T00:00:00Z",
    } as ManagedSession),
    sendMessageAndStream: vi.fn(),
    getSessionMessages: vi.fn(),
    ...overrides,
  };
}

function makeRequest(body: unknown, url = "http://localhost/api/teacher/threads"): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- Tests for managedCreateThread ---
describe("managedCreateThread", () => {
  it("deve criar sessão e retornar threadId com 201", async () => {
    const { managedCreateThread } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway();
    const req = makeRequest({ agentSlug: "tea-consultant" });

    // Mock do insert para retornar id
    const insertSingle = vi.fn().mockResolvedValue({ data: { id: "thread-abc" }, error: null });
    (ctx.supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "consultant_threads") {
        return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertSingle }) }) };
      }
      return {};
    });

    const res = await managedCreateThread(ctx, req, gateway);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.threadId).toBe("thread-abc");
    expect(gateway.createSession).toHaveBeenCalledOnce();
  });

  it("deve persistir managed_session_id no INSERT", async () => {
    const { managedCreateThread } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway();
    const req = makeRequest({ agentSlug: "tea-consultant" });

    let insertedData: unknown;
    (ctx.supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "consultant_threads") {
        return {
          insert: vi.fn((data) => {
            insertedData = data;
            return { select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: "thread-abc" }, error: null }) }) };
          }),
        };
      }
      return {};
    });

    await managedCreateThread(ctx, req, gateway);
    expect((insertedData as Record<string, unknown>).managed_session_id).toBe("sess_01");
  });

  it("deve retornar 500 sem INSERT quando createSession falha", async () => {
    const { managedCreateThread } = await import("./thread-handlers-managed");

    const insertFn = vi.fn();
    const ctx = makeCtx();
    (ctx.supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "consultant_threads") {
        return { insert: insertFn };
      }
      return {};
    });

    const gateway = makeGateway({
      createSession: vi.fn().mockRejectedValue(new Error("API down")),
    });
    const req = makeRequest({ agentSlug: "tea-consultant" });

    const res = await managedCreateThread(ctx, req, gateway);

    expect(res.status).toBe(500);
    expect(insertFn).not.toHaveBeenCalled();
  });

  it("deve retornar 400 para agentSlug inválido", async () => {
    const { managedCreateThread } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway();
    const req = makeRequest({ agentSlug: "slug-inexistente" });

    const res = await managedCreateThread(ctx, req, gateway);
    expect(res.status).toBe(400);
    expect(gateway.createSession).not.toHaveBeenCalled();
  });
});

// Helper para criar async iterables em testes
async function* makeStream(events: unknown[]): AsyncGenerator<unknown> {
  for (const event of events) yield event;
}

import type { ManagedEvent } from "@/gateways/managed-agents";

describe("consumeManagedStreamToText", () => {
  it("deve acumular texto de um evento agent.message simples", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "agent.message", content: [{ type: "text", text: "Resposta completa." }] },
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Resposta completa.");
  });

  it("deve acumular texto de múltiplos eventos agent.message", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "agent.message", content: [{ type: "text", text: "Parte 1. " }] },
      { type: "agent.message", content: [{ type: "text", text: "Parte 2." }] },
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Parte 1. Parte 2.");
  });

  it("deve ignorar eventos agent.tool_use", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "agent.tool_use", name: "memory_search", input: { query: "TEA" } },
      { type: "agent.message", content: [{ type: "text", text: "Resposta." }] },
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Resposta.");
    expect(text).not.toContain("memory_search");
    expect(text).not.toContain("TEA");
  });

  it("deve parar ao encontrar session.status_idle", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "agent.message", content: [{ type: "text", text: "Antes do idle." }] },
      { type: "session.status_idle" },
      { type: "agent.message", content: [{ type: "text", text: "Após o idle — não deve aparecer." }] },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Antes do idle.");
    expect(text).not.toContain("Após o idle");
  });

  it("deve concatenar múltiplos blocos de texto em um único agent.message", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      {
        type: "agent.message",
        content: [
          { type: "text", text: "Bloco A. " },
          { type: "tool_use", id: "tool_1" },
          { type: "text", text: "Bloco B." },
        ],
      },
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Bloco A. Bloco B.");
  });

  it("deve retornar texto vazio quando stream não produz agent.message", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("");
  });
});

import type { SessionMessage } from "@/gateways/managed-agents";

describe("managedGetMessages", () => {
  function makeMessagesRequest(threadId = "thread-abc"): Request {
    return new Request(`http://localhost/api/teacher/threads/${threadId}/messages`);
  }

  it("deve retornar mensagens no formato correto", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const messages: SessionMessage[] = [
      { id: "evt_1", role: "user", content: "Como adaptar?", createdAt: "2026-04-10T10:00:00Z" },
      { id: "evt_2", role: "assistant", content: "Para adaptar...", createdAt: "2026-04-10T10:00:05Z" },
    ];
    const gateway = makeGateway({
      getSessionMessages: vi.fn().mockResolvedValue(messages),
    });

    const res = await managedGetMessages(ctx, makeMessagesRequest(), gateway);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.messages).toHaveLength(2);
    expect(body.data.messages[0]).toEqual(messages[0]);
    expect(body.data.messages[1]).toEqual(messages[1]);
  });

  it("deve chamar gateway com o managed_session_id correto", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx({ threadRow: { id: "thread-abc", managed_session_id: "sess_XYZ" } });
    const gateway = makeGateway({ getSessionMessages: vi.fn().mockResolvedValue([]) });

    await managedGetMessages(ctx, makeMessagesRequest(), gateway);

    expect(gateway.getSessionMessages).toHaveBeenCalledWith("sess_XYZ");
  });

  it("deve retornar array vazio quando não há mensagens", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway({ getSessionMessages: vi.fn().mockResolvedValue([]) });

    const res = await managedGetMessages(ctx, makeMessagesRequest(), gateway);
    const body = await res.json();

    expect(body.data.messages).toEqual([]);
  });

  it("deve retornar 404 quando thread não existe", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx({ threadRow: null, threadError: { code: "PGRST116" } });
    const gateway = makeGateway();

    const res = await managedGetMessages(ctx, makeMessagesRequest(), gateway);

    expect(res.status).toBe(404);
    expect(gateway.getSessionMessages).not.toHaveBeenCalled();
  });

  it("deve retornar array vazio quando gateway lança erro", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway({
      getSessionMessages: vi.fn().mockRejectedValue(new Error("API error")),
    });

    const res = await managedGetMessages(ctx, makeMessagesRequest(), gateway);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.messages).toEqual([]);
  });
});
