import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExtractionReview } from "@/features/exams/extraction/components/extraction-review";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.success,
    error: mocks.error,
  },
}));

const questions = [
  {
    id: "question-1",
    orderNum: 1,
    content: "Quanto é 2 + 2?",
    questionType: "objective" as const,
    alternatives: [
      { label: "A", text: "3" },
      { label: "B", text: "4" },
    ],
    visualElements: null,
    extractionWarning: "Alternativa C estava ilegível.",
  },
  {
    id: "question-2",
    orderNum: 2,
    content: "Explique o ciclo da água.",
    questionType: "essay" as const,
    alternatives: null,
    visualElements: [
      { type: "diagram", description: "Esquema do ciclo da água." },
    ],
    extractionWarning: null,
  },
];

describe("extraction review", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.success.mockReset();
    mocks.error.mockReset();
  });

  it("renders objective and essay questions with warnings and visual elements", () => {
    render(<ExtractionReview examId="exam-1" questions={questions} />);

    expect(screen.getByRole("heading", { level: 2, name: /questão 1/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /questão 2/i })).toBeInTheDocument();
    expect(screen.getByText(/alternativa c estava ilegível/i)).toBeInTheDocument();
    expect(screen.getByText(/esquema do ciclo da água/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /a 3/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/resposta esperada da questão 2/i)).toBeInTheDocument();
  });

  it("renders an explicit empty state when there are no extracted questions", () => {
    render(<ExtractionReview examId="exam-1" questions={[]} />);

    expect(screen.getByText(/nenhuma questão foi extraída para revisão/i)).toBeInTheDocument();
  });

  it("shows progress indicator counting answered questions", () => {
    render(<ExtractionReview examId="exam-1" questions={questions} />);

    expect(screen.getByText(/0 de 2 respondidas/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /b 4/i }));

    expect(screen.getByText(/1 de 2 respondidas/i)).toBeInTheDocument();
  });

  it("shows fixed submit banner when all questions are answered", () => {
    render(<ExtractionReview examId="exam-1" questions={questions} />);

    fireEvent.click(screen.getByRole("radio", { name: /b 4/i }));
    fireEvent.change(screen.getByLabelText(/resposta esperada da questão 2/i), {
      target: { value: "Evaporação" },
    });

    expect(screen.getByText(/todas as questões revisadas/i)).toBeInTheDocument();
  });

  const threeQuestions = [
    ...questions,
    {
      id: "question-3",
      orderNum: 3,
      content: "Qual a capital do Brasil?",
      questionType: "objective" as const,
      alternatives: [
        { label: "A", text: "São Paulo" },
        { label: "B", text: "Brasília" },
      ],
      visualElements: null,
      extractionWarning: null,
    },
  ];

  it("shows FAB when there are unanswered questions and more than 2 total", () => {
    render(<ExtractionReview examId="exam-1" questions={threeQuestions} />);

    expect(screen.getByRole("button", { name: /próxima questão sem resposta/i })).toBeInTheDocument();
  });

  it("submits reviewed answers and redirects back to processing", async () => {
    const resolveFetchRef: {
      current: null | ((value: {
        ok: boolean;
        json(): Promise<{ success: boolean }>;
      }) => void);
    } = {
      current: null,
    };
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetchRef.current = resolve;
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<ExtractionReview examId="exam-1" questions={questions} />);

    fireEvent.click(screen.getByRole("radio", { name: /b 4/i }));
    fireEvent.change(screen.getByLabelText(/resposta esperada da questão 2/i), {
      target: { value: "Processo de evaporação e condensação." },
    });
    fireEvent.click(screen.getByRole("button", { name: /avançar para adaptação/i }));

    expect(await screen.findByRole("button", { name: /salvando revisão/i })).toBeDisabled();

    if (resolveFetchRef.current) {
      resolveFetchRef.current({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });
    }

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/exams/exam-1/answers",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    await waitFor(() => {
      expect(mocks.success).toHaveBeenCalledWith("Respostas salvas. A adaptação foi iniciada.");
      expect(mocks.refresh).toHaveBeenCalled();
      expect(mocks.push).toHaveBeenCalledWith("/exams/exam-1/processing");
    });
  });
});
