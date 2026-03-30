"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamStatus } from "@/domains/exams/contracts";

export type ExamProgressData = {
  status: ExamStatus;
  errorMessage: string | null;
  progress: {
    total: number;
    completed: number;
    questionsCount: number;
    questionsCompleted: number;
  };
};

const POLL_INTERVAL_MS = 4000;
const REDIRECT_DELAY_MS = 1000;
const TERMINAL_STATUSES: ExamStatus[] = ["completed", "error", "awaiting_answers"];

export function useExamProgress(examId: string, initialData: ExamProgressData) {
  const router = useRouter();
  const [data, setData] = useState<ExamProgressData>(initialData);
  const [isPolling, setIsPolling] = useState(
    !TERMINAL_STATUSES.includes(initialData.status),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const response = await fetch(`/api/exams/${examId}/status`);
      if (!response.ok) return;

      const json = await response.json();
      const newData = json.data as ExamProgressData;
      setData(newData);

      if (newData.status === "completed") {
        stopPolling();
        setTimeout(() => router.push(`/exams/${examId}/result`), REDIRECT_DELAY_MS);
      } else if (newData.status === "awaiting_answers") {
        stopPolling();
        router.push(`/exams/${examId}/extraction`);
      } else if (newData.status === "error") {
        stopPolling();
      }
    } catch {
      // Silently ignore fetch errors — next poll will retry
    }
  }, [examId, router, stopPolling]);

  useEffect(() => {
    if (!isPolling) return;

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPolling, poll]);

  return {
    status: data.status,
    errorMessage: data.errorMessage,
    progress: data.progress,
    isPolling,
  };
}
