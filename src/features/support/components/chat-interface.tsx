"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Loader2 } from "lucide-react";

type ChatInterfaceProps = {
  threadId: string;
  agentSlug: string;
};

export function ChatInterface({ threadId, agentSlug }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, append } =
    useChat({
      api: `/api/teacher/threads/${threadId}/messages`,
      body: { threadId },
    });

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  function handleSend(content: string) {
    append({ role: "user", content });
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
              content={message.content}
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
