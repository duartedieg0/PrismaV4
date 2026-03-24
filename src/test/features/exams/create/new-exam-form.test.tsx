import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewExamForm } from "@/features/exams/create/components/new-exam-form";

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

const subjects = [
  { id: "550e8400-e29b-41d4-a716-446655440000", name: "Matemática" },
];

const gradeLevels = [
  { id: "550e8400-e29b-41d4-a716-446655440001", name: "7º ano" },
];

const supports = [
  { id: "550e8400-e29b-41d4-a716-446655440002", name: "Dislexia" },
  { id: "550e8400-e29b-41d4-a716-446655440003", name: "TDAH" },
];

describe("new exam form", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.success.mockReset();
    mocks.error.mockReset();
  });

  it("renders the intake fields and the submission CTA", () => {
    render(
      <NewExamForm
        subjects={subjects}
        gradeLevels={gradeLevels}
        supports={supports}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: /informações da prova/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/disciplina/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ano\/série/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tema/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/arquivo pdf/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /dislexia/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar para adaptação/i })).toBeInTheDocument();
  });

  it("shows validation errors when required data is missing", async () => {
    render(
      <NewExamForm
        subjects={subjects}
        gradeLevels={gradeLevels}
        supports={supports}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /enviar para adaptação/i }));

    expect(await screen.findByText(/selecione uma disciplina valida/i)).toBeInTheDocument();
    expect(screen.getByText(/selecione um ano\/série valido/i)).toBeInTheDocument();
    expect(screen.getByText(/selecione ao menos um apoio/i)).toBeInTheDocument();
    expect(screen.getByText(/selecione um arquivo pdf/i)).toBeInTheDocument();
  });

  it("blocks non-pdf uploads before submitting", async () => {
    render(
      <NewExamForm
        subjects={subjects}
        gradeLevels={gradeLevels}
        supports={supports}
      />,
    );

    const fileInput = screen.getByLabelText(/arquivo pdf/i);
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["hello"], "avaliacao.txt", { type: "text/plain" })],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /enviar para adaptação/i }));

    expect(await screen.findByText(/o arquivo deve ser um pdf/i)).toBeInTheDocument();
  });

  it("clears the file input when the user removes the uploaded pdf", () => {
    render(
      <NewExamForm
        subjects={subjects}
        gradeLevels={gradeLevels}
        supports={supports}
      />,
    );

    const fileInput = screen.getByLabelText(/arquivo pdf/i) as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["pdf"], "avaliacao.pdf", { type: "application/pdf" })],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /remover arquivo/i }));

    expect(fileInput.value).toBe("");
    expect(screen.queryByText("avaliacao.pdf")).not.toBeInTheDocument();
  });

  it("submits the form data, keeps the pending state and redirects to processing on success", async () => {
    const resolveFetchRef: {
      current: null | ((value: {
      ok: boolean;
      json(): Promise<{ examId: string }>;
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

    render(
      <NewExamForm
        subjects={subjects}
        gradeLevels={gradeLevels}
        supports={supports}
      />,
    );

    fireEvent.change(screen.getByLabelText(/disciplina/i), {
      target: { value: subjects[0].id },
    });
    fireEvent.change(screen.getByLabelText(/ano\/série/i), {
      target: { value: gradeLevels[0].id },
    });
    fireEvent.change(screen.getByLabelText(/tema/i), {
      target: { value: "Frações" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /dislexia/i }));
    fireEvent.change(screen.getByLabelText(/arquivo pdf/i), {
      target: {
        files: [new File(["pdf"], "avaliacao.pdf", { type: "application/pdf" })],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /enviar para adaptação/i }));

    expect(await screen.findByRole("button", { name: /enviando prova/i })).toBeDisabled();

    if (resolveFetchRef.current) {
      resolveFetchRef.current({
        ok: true,
        json: async () => ({
          examId: "exam-123",
        }),
      });
    }

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/exams",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      );
    });

    await waitFor(() => {
      expect(mocks.success).toHaveBeenCalledWith("Prova enviada para adaptação.");
      expect(mocks.refresh).toHaveBeenCalled();
      expect(mocks.push).toHaveBeenCalledWith("/exams/exam-123/processing");
    });
  });

  it("renders an explicit empty state when no active supports are available", () => {
    render(
      <NewExamForm
        subjects={subjects}
        gradeLevels={gradeLevels}
        supports={[]}
      />,
    );

    expect(screen.getByText(/nenhum apoio ativo está disponível/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar para adaptação/i })).toBeDisabled();
  });
});
