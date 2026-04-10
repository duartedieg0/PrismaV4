import { describe, it, expect, vi, beforeEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { createTeaConsultantGateway } from "../tea-consultant";
import { SessionNotFoundError, SessionStreamError, ManagedAgentError } from "../errors";
import type { AgentConfig } from "../types";

// Mock do client Anthropic — injetado via factory, sem vi.mock()
const mockSessionCreate = vi.fn();
const mockEventsSend = vi.fn();
const mockEventsStream = vi.fn();
const mockEventsList = vi.fn();

const mockClient = {
  beta: {
    sessions: {
      create: mockSessionCreate,
      events: {
        send: mockEventsSend,
        stream: mockEventsStream,
        list: mockEventsList,
      },
    },
  },
} as unknown as Anthropic;

const mockConfig: AgentConfig = {
  agentId: "agent_01test",
  environmentId: "env_01test",
  memoryStoreId: "memstore_01test",
};

describe("createTeaConsultantGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("deve criar sessão com agentId, environmentId e memory store corretos", async () => {
      mockSessionCreate.mockResolvedValue({
        id: "sess_01abc",
        agent_id: "agent_01test",
        created_at: "2026-04-10T00:00:00Z",
      });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const session = await gateway.createSession("Minha conversa");

      expect(mockSessionCreate).toHaveBeenCalledOnce();
      const callArg = mockSessionCreate.mock.calls[0][0];
      expect(callArg.agent_id).toBe("agent_01test");
      expect(callArg.environment_id).toBe("env_01test");
      // Memory store deve estar no array de resources
      const memResource = callArg.resources?.find(
        (r: { type: string }) => r.type === "memory_store",
      );
      expect(memResource).toBeDefined();
      expect(memResource.memory_store_id).toBe("memstore_01test");
      expect(memResource.mode).toBe("read_only");
    });

    it("deve retornar ManagedSession com id, agentId e createdAt", async () => {
      mockSessionCreate.mockResolvedValue({
        id: "sess_01abc",
        agent_id: "agent_01test",
        created_at: "2026-04-10T00:00:00Z",
      });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const session = await gateway.createSession();

      expect(session.id).toBe("sess_01abc");
      expect(session.agentId).toBe("agent_01test");
      expect(session.createdAt).toBe("2026-04-10T00:00:00Z");
    });

    it("deve lançar ManagedAgentError quando SDK falha", async () => {
      mockSessionCreate.mockRejectedValue(new Error("API error"));

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);

      await expect(gateway.createSession()).rejects.toBeInstanceOf(ManagedAgentError);
    });
  });

  describe("sendMessageAndStream", () => {
    it("deve abrir stream e enviar mensagem do usuário", async () => {
      const mockStream = (async function* () {
        yield { type: "agent.message", content: "resposta" };
      })();
      mockEventsStream.mockResolvedValue(mockStream);
      mockEventsSend.mockResolvedValue(undefined);

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const stream = await gateway.sendMessageAndStream("sess_01abc", "Olá");

      expect(mockEventsStream).toHaveBeenCalledWith("sess_01abc");
      expect(mockEventsSend).toHaveBeenCalledWith(
        "sess_01abc",
        expect.objectContaining({ type: "user.message" }),
      );
      // Stream deve ser iterável
      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });

    it("deve lançar SessionNotFoundError quando sessão não existe (404)", async () => {
      const notFoundError = Object.assign(new Error("Not found"), { status: 404 });
      mockEventsStream.mockRejectedValue(notFoundError);

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);

      await expect(
        gateway.sendMessageAndStream("sess_inexistente", "Olá"),
      ).rejects.toBeInstanceOf(SessionNotFoundError);
    });

    it("deve lançar SessionStreamError para outros erros de stream", async () => {
      mockEventsStream.mockRejectedValue(new Error("Connection reset"));

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);

      await expect(
        gateway.sendMessageAndStream("sess_01abc", "Olá"),
      ).rejects.toBeInstanceOf(SessionStreamError);
    });
  });

  describe("getSessionMessages", () => {
    it("deve retornar apenas mensagens user e assistant", async () => {
      mockEventsList.mockResolvedValue({
        data: [
          {
            id: "evt_1",
            type: "user.message",
            content: [{ type: "text", text: "Pergunta do professor" }],
            created_at: "2026-04-10T10:00:00Z",
          },
          {
            id: "evt_2",
            type: "session.started", // deve ser filtrado
            created_at: "2026-04-10T09:59:00Z",
          },
          {
            id: "evt_3",
            type: "agent.message",
            content: [{ type: "text", text: "Resposta do assistente" }],
            created_at: "2026-04-10T10:00:05Z",
          },
        ],
      });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const messages = await gateway.getSessionMessages("sess_01abc");

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        id: "evt_1",
        role: "user",
        content: "Pergunta do professor",
        createdAt: "2026-04-10T10:00:00Z",
      });
      expect(messages[1]).toEqual({
        id: "evt_3",
        role: "assistant",
        content: "Resposta do assistente",
        createdAt: "2026-04-10T10:00:05Z",
      });
    });

    it("deve retornar array vazio quando não há mensagens", async () => {
      mockEventsList.mockResolvedValue({ data: [] });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const messages = await gateway.getSessionMessages("sess_01abc");

      expect(messages).toEqual([]);
    });

    it("deve lançar ManagedAgentError quando listagem de eventos falha", async () => {
      mockEventsList.mockRejectedValue(new Error("API error"));

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);

      await expect(
        gateway.getSessionMessages("sess_01abc"),
      ).rejects.toBeInstanceOf(ManagedAgentError);
    });

    it("deve concatenar múltiplos blocos de texto em um único content", async () => {
      mockEventsList.mockResolvedValue({
        data: [
          {
            id: "evt_1",
            type: "agent.message",
            content: [
              { type: "text", text: "Parte 1. " },
              { type: "text", text: "Parte 2." },
            ],
            created_at: "2026-04-10T10:00:00Z",
          },
        ],
      });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const messages = await gateway.getSessionMessages("sess_01abc");

      expect(messages[0].content).toBe("Parte 1. Parte 2.");
    });
  });
});
