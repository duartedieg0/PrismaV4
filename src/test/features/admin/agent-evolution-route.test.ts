import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminRouteAccess = vi.fn();
const agentsSingle = vi.fn();
const feedbacksIn = vi.fn();
const modelsSelect = vi.fn();
const evolutionUpdateEq = vi.fn();
const agentPromptUpdateEq = vi.fn();
const suggestAgentEvolution = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/features/admin/agents/evolution/service", () => ({
  suggestAgentEvolution,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "agents") {
        return {
          select: () => ({
            eq: () => ({
              single: agentsSingle,
            }),
          }),
          update: () => ({
            eq: agentPromptUpdateEq,
          }),
        };
      }

      if (table === "feedbacks") {
        return {
          select: () => ({
            in: feedbacksIn,
          }),
        };
      }

      if (table === "ai_models") {
        return {
          select: modelsSelect,
        };
      }

      if (table === "agent_evolutions") {
        return {
          update: () => ({
            eq() {
              return {
                eq: evolutionUpdateEq,
              };
            },
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("agent evolution route", () => {
  beforeEach(() => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "ok",
      role: "admin",
      userId: "admin-1",
    });
    agentsSingle.mockReset();
    feedbacksIn.mockReset();
    modelsSelect.mockReset();
    evolutionUpdateEq.mockReset();
    agentPromptUpdateEq.mockReset();
    suggestAgentEvolution.mockReset();
  });

  it("generates an evolution suggestion", async () => {
    const { POST } = await import("@/app/api/admin/agents/[id]/evolve/route");

    agentsSingle.mockResolvedValue({
      data: {
        id: "agent-1",
        name: "BNCC",
        objective: null,
        prompt: "Prompt atual",
        version: 1,
      },
      error: null,
    });
    feedbacksIn.mockReturnValue({
      eq: () => Promise.resolve({
        data: [{
          id: "550e8400-e29b-41d4-a716-446655440000",
          rating: 5,
          comment: "Melhorar clareza",
          created_at: "2026-03-21T00:00:00.000Z",
          dismissed_from_evolution: false,
          adaptations: {
            adapted_content: "Adaptado",
            supports: { name: "Leitura guiada" },
            questions: { content: "Original" },
          },
        }],
        error: null,
      }),
    });
    modelsSelect.mockResolvedValue({
      data: [{
        id: "model-1",
        name: "GPT",
        provider: "openai",
        base_url: "https://example.com",
        api_key: "secret",
        model_id: "gpt",
        enabled: true,
        is_default: true,
        system_role: "evolution",
        created_at: "2026-03-21T00:00:00.000Z",
      }],
      error: null,
    });
    suggestAgentEvolution.mockResolvedValue({
      evolutionId: "550e8400-e29b-41d4-a716-446655440001",
      originalPrompt: "Prompt atual",
      suggestedPrompt: "Novo prompt",
      commentary: "Comentário",
      currentVersion: 1,
      suggestedVersion: 2,
    });

    const response = await POST(
      new Request("http://localhost/api/admin/agents/agent-1/evolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackIds: ["550e8400-e29b-41d4-a716-446655440000"],
        }),
      }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );

    expect(response.status).toBe(200);
  });

  it("accepts an evolution suggestion and increments the agent version", async () => {
    const { PATCH } = await import("@/app/api/admin/agents/[id]/evolve/route");

    agentsSingle.mockResolvedValue({
      data: {
        version: 2,
      },
      error: null,
    });
    evolutionUpdateEq.mockResolvedValue({ error: null });
    agentPromptUpdateEq.mockResolvedValue({ error: null });

    const response = await PATCH(
      new Request("http://localhost/api/admin/agents/agent-1/evolve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionId: "550e8400-e29b-41d4-a716-446655440001",
          accepted: true,
          suggestedPrompt: "Prompt aceito",
        }),
      }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );

    expect(response.status).toBe(200);
    expect(agentPromptUpdateEq).toHaveBeenCalled();
    expect(evolutionUpdateEq).toHaveBeenCalled();
  });

  it("requires at least one feedback id", async () => {
    const { POST } = await import("@/app/api/admin/agents/[id]/evolve/route");

    const response = await POST(
      new Request("http://localhost/api/admin/agents/agent-1/evolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackIds: [],
        }),
      }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );

    expect(response.status).toBe(400);
  });
});
