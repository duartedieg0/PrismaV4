import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeacherContext } from "@/features/support/with-teacher-route";
import type { TeaConsultantGateway, SessionMessage, ManagedSession } from "@/gateways/managed-agents";

// Capture after() callbacks so we can drain the stream first, then run them
const afterCallbacks: Array<() => Promise<void>> = [];
async function runAfterCallbacks() {
  for (const cb of afterCallbacks) await cb();
  afterCallbacks.length = 0;
}

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: vi.fn((cb: () => Promise<void>) => { afterCallbacks.push(cb); }),
  };
});
vi.mock("@/mastra/providers/provider-factory", () => ({
  createMastraModel: vi.fn(() => ({ modelId: "mock-model" })),
}));
vi.mock("@/features/support/thread-title", () => ({
  generateThreadTitle: vi.fn().mockResolvedValue("Título Gerado Automaticamente"),
}));

// ------- helpers -------

async function* makeEvents(events: unknown[]): AsyncGenerator<unknown> {
  for (const e of events) yield e;
}

function makeSupabase(opts: {
  thread?: Record<string, unknown> | null;
  threadError?: unknown;
  insertedId?: string;
}): SupabaseClient {
  const thread = opts.thread ?? {
    id: opts.insertedId ?? "thread-001",
    title: null,
    managed_session_id: "sess_integration",
    agent_slug: "tea-consultant",
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "consultant_threads") {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: opts.insertedId ?? "thread-001" }, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            opts.threadError ? { data: null, error: opts.threadError } : { data: thread, error: null },
          ),
        };
      }
      if (table === "ai_models") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{
              id: "m1", name: "Test", provider: "openai",
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
}

function makeGateway(opts: Partial<TeaConsultantGateway> = {}): TeaConsultantGateway {
  return {
    createSession: vi.fn().mockResolvedValue({ id: "sess_integration", agentId: "agent_01", createdAt: "2026-04-10T00:00:00Z" } as ManagedSession),
    sendMessageAndStream: vi.fn().mockResolvedValue(makeEvents([
      { type: "agent.tool_use", name: "memory_search" },
      { type: "agent.message", content: [{ type: "text", text: "Resposta do consultor." }] },
      { type: "session.status_idle" },
    ])),
    getSessionMessages: vi.fn().mockResolvedValue([
      { id: "evt_1", role: "user", content: "Pergunta", createdAt: "2026-04-10T10:00:00Z" },
      { id: "evt_2", role: "assistant", content: "Resposta", createdAt: "2026-04-10T10:00:05Z" },
    ] as SessionMessage[]),
    ...opts,
  };
}

// ------- cenários -------

describe("Fluxo completo Managed Agents — integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    afterCallbacks.length = 0;
  });

  // Cenário 1
  it("C1: criar thread managed salva managed_session_id", async () => {
    const { managedCreateThread } = await import("@/features/support/thread-handlers-managed");

    let insertedPayload: unknown;
    const supabase = makeSupabase({ insertedId: "thread-001" });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "consultant_threads") {
        return {
          insert: vi.fn((data) => {
            insertedPayload = data;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "thread-001" }, error: null }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const ctx: TeacherContext = { supabase, userId: "user-001" };
    const gateway = makeGateway();
    const req = new Request("http://localhost/api/teacher/threads", {
      method: "POST",
      body: JSON.stringify({ agentSlug: "tea-consultant" }),
    });

    const res = await managedCreateThread(ctx, req, gateway);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.threadId).toBe("thread-001");
    expect(gateway.createSession).toHaveBeenCalledOnce();
    expect((insertedPayload as Record<string, unknown>).managed_session_id).toBe("sess_integration");
  });

  // Cenário 2
  it("C2: primeira mensagem → streaming funcional + título gerado", async () => {
    const { managedStreamMessage } = await import("@/features/support/thread-handlers-managed");
    const { generateThreadTitle } = await import("@/features/support/thread-title");

    const ctx: TeacherContext = {
      supabase: makeSupabase({ thread: { id: "t1", title: null, managed_session_id: "sess_01", agent_slug: "tea-consultant" } }),
      userId: "user-001",
    };
    const gateway = makeGateway();
    const req = new Request("http://localhost/api/teacher/threads/t1/messages", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Como adaptar provas para TEA?" }] }),
    });

    const res = await managedStreamMessage(ctx, req, gateway);
    expect(res.status).toBe(200);

    // Drain the stream body so execute() completes and fullResponse is populated
    const reader = res.body!.getReader();
    while (!(await reader.read()).done) { /* drain */ }
    // Now run deferred after() callbacks
    await runAfterCallbacks();

    expect(generateThreadTitle).toHaveBeenCalledWith(
      expect.anything(),
      "Como adaptar provas para TEA?",
      "Resposta do consultor.",
    );
  });

  // Cenário 3
  it("C3: segunda mensagem → session reutilizada, título não regenerado", async () => {
    const { managedStreamMessage } = await import("@/features/support/thread-handlers-managed");
    const { generateThreadTitle } = await import("@/features/support/thread-title");
    vi.mocked(generateThreadTitle).mockClear();

    const ctx: TeacherContext = {
      supabase: makeSupabase({ thread: { id: "t1", title: "Título existente", managed_session_id: "sess_01", agent_slug: "tea-consultant" } }),
      userId: "user-001",
    };
    const sendMock = vi.fn().mockResolvedValue(makeEvents([{ type: "session.status_idle" }]));
    const gateway = makeGateway({ sendMessageAndStream: sendMock });
    const req = new Request("http://localhost/api/teacher/threads/t1/messages", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Segunda pergunta" }] }),
    });

    const res = await managedStreamMessage(ctx, req, gateway);
    // Drain stream and run after() callbacks to ensure title logic has run
    const reader = res.body!.getReader();
    while (!(await reader.read()).done) { /* drain */ }
    await runAfterCallbacks();

    expect(sendMock).toHaveBeenCalledWith("sess_01", "Segunda pergunta");
    expect(generateThreadTitle).not.toHaveBeenCalled();
  });

  // Cenário 4
  it("C4: leitura de histórico retorna formato correto sem tool_use", async () => {
    const { managedGetMessages } = await import("@/features/support/thread-handlers-managed");

    const messages: SessionMessage[] = [
      { id: "evt_1", role: "user", content: "Pergunta", createdAt: "2026-04-10T10:00:00Z" },
      { id: "evt_2", role: "assistant", content: "Resposta", createdAt: "2026-04-10T10:00:05Z" },
    ];
    const ctx: TeacherContext = { supabase: makeSupabase({}), userId: "user-001" };
    const gateway = makeGateway({ getSessionMessages: vi.fn().mockResolvedValue(messages) });
    const req = new Request("http://localhost/api/teacher/threads/t1/messages");

    const res = await managedGetMessages(ctx, req, gateway);
    const body = await res.json();

    expect(body.data.messages).toHaveLength(2);
    expect(body.data.messages.every((m: SessionMessage) => ["user", "assistant"].includes(m.role))).toBe(true);
    expect(body.data.messages.find((m: SessionMessage) => m.content.includes("memory_search"))).toBeUndefined();
  });

  // Cenário 5
  it("C5: erro mid-stream não causa crash (stream termina com mensagem de erro)", async () => {
    const { managedStreamMessage } = await import("@/features/support/thread-handlers-managed");

    async function* errorStream(): AsyncGenerator<unknown> {
      yield { type: "agent.message", content: [{ type: "text", text: "Início..." }] };
      throw new Error("Connection reset mid-stream");
    }

    const ctx: TeacherContext = { supabase: makeSupabase({}), userId: "user-001" };
    const gateway = makeGateway({ sendMessageAndStream: vi.fn().mockResolvedValue(errorStream()) });
    const req = new Request("http://localhost/api/teacher/threads/t1/messages", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Pergunta" }] }),
    });

    const res = await managedStreamMessage(ctx, req, gateway);
    expect(res.status).toBe(200);
    await expect(res.body?.cancel()).resolves.not.toThrow();
  });

  // Cenário 6
  it("C6: feature flag 'mastra' → zero chamadas ao gateway Managed", async () => {
    const { mastraCreateThread } = await import("@/features/support/thread-handlers-mastra");
    const gateway = makeGateway();

    const ctx: TeacherContext = {
      supabase: {
        from: vi.fn(() => ({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "thread-mastra" }, error: null }),
            }),
          }),
        })),
      } as unknown as SupabaseClient,
      userId: "user-001",
    };
    const req = new Request("http://localhost/api/teacher/threads", {
      method: "POST",
      body: JSON.stringify({ agentSlug: "tea-consultant" }),
    });

    await mastraCreateThread(ctx, req);

    expect(gateway.createSession).not.toHaveBeenCalled();
    expect(gateway.sendMessageAndStream).not.toHaveBeenCalled();
    expect(gateway.getSessionMessages).not.toHaveBeenCalled();
  });
});
