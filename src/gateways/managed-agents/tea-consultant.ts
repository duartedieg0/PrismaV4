import type Anthropic from "@anthropic-ai/sdk";
import { ManagedAgentError, SessionNotFoundError, SessionStreamError } from "./errors";
import type { AgentConfig, ManagedEvent, ManagedSession, SessionMessage } from "./types";

export interface TeaConsultantGateway {
  createSession(title?: string): Promise<ManagedSession>;
  sendMessageAndStream(
    sessionId: string,
    message: string,
  ): Promise<AsyncIterable<ManagedEvent>>;
  getSessionMessages(sessionId: string): Promise<SessionMessage[]>;
}

function extractTextContent(
  content: Array<{ type: string; text?: string }> | undefined,
): string {
  if (!content) return "";
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");
}

export function createTeaConsultantGateway(
  client: Anthropic,
  config: AgentConfig,
): TeaConsultantGateway {
  return {
    async createSession(_title?: string): Promise<ManagedSession> {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = await (client.beta.sessions as any).create({
          agent_id: config.agentId,
          environment_id: config.environmentId,
          resources: [
            {
              type: "memory_store",
              memory_store_id: config.memoryStoreId,
              mode: "read_only",
              prompt:
                "Base de conhecimento sobre TEA e adaptação de avaliações. Consulte SEMPRE antes de responder perguntas do professor.",
            },
          ],
        });

        return {
          id: session.id as string,
          agentId: session.agent_id as string,
          createdAt: session.created_at as string,
        };
      } catch (error) {
        throw new ManagedAgentError(
          `Falha ao criar sessão: ${String(error)}`,
          "SESSION_CREATE_ERROR",
        );
      }
    },

    async sendMessageAndStream(
      sessionId: string,
      message: string,
    ): Promise<AsyncIterable<ManagedEvent>> {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events = client.beta.sessions.events as any;

        // Abrir stream antes de enviar a mensagem
        const stream = await events.stream(sessionId);

        // Enviar a mensagem do usuário
        await events.send(sessionId, {
          type: "user.message",
          content: [{ type: "text", text: message }],
        });

        return stream as AsyncIterable<ManagedEvent>;
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          throw new SessionNotFoundError(sessionId);
        }
        throw new SessionStreamError(String(error));
      }
    },

    async getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (client.beta.sessions.events as any).list(sessionId);

      const events: Array<{
        id: string;
        type: string;
        content?: Array<{ type: string; text?: string }>;
        created_at: string;
      }> = result.data ?? result;

      return events
        .filter((e) => e.type === "user.message" || e.type === "agent.message")
        .map((e) => ({
          id: e.id,
          role: e.type === "user.message" ? ("user" as const) : ("assistant" as const),
          content: extractTextContent(e.content),
          createdAt: e.created_at,
        }));
    },
  };
}
