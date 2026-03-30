"use client";

import { useEffect, useState } from "react";

export function useRotatingMessage(messages: string[], intervalMs = 4000): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [messages, intervalMs]);

  return messages[index] ?? messages[0];
}
