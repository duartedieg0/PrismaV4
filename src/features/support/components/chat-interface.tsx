"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Loader2 } from "lucide-react";

type ChatInterfaceProps = {
  threadId: string;
  agentSlug: string;
};

type HistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export function ChatInterface({ threadId, agentSlug }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null,
  );

  // Carregar histórico de mensagens ao montar
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(
          `/api/teacher/threads/${threadId}/messages`,
        );
        if (!res.ok) {
          setInitialMessages([]);
          return;
        }
        const json = await res.json();
        const history: HistoryMessage[] = json.data?.messages ?? [];

        const uiMessages: UIMessage[] = history.map((m) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
          createdAt: new Date(m.createdAt),
        }));

        setInitialMessages(uiMessages);
      } catch {
        setInitialMessages([]);
      }
    }
    loadHistory();
  }, [threadId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/teacher/threads/${threadId}/messages`,
      }),
    [threadId],
  );

  const { messages, status, sendMessage } = useChat({
    transport,
    messages: initialMessages ?? undefined,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  function handleSend(content: string) {
    sendMessage({ text: content });
  }

  // Extrair conteúdo textual das partes da mensagem
  function getMessageContent(message: (typeof messages)[number]): string {
    return message.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }

  // Mostrar loading enquanto carrega o histórico
  if (initialMessages === null) {
    return (
      <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando conversa...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col lg:h-[calc(100vh-12rem)]">
      {/* Área de mensagens */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-4"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role as "user" | "assistant"}
              content={getMessageContent(message)}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Digitando...
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="mx-auto w-full max-w-3xl px-2 pb-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
