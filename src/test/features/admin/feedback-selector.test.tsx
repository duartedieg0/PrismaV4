import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeedbackSelector } from "@/features/admin/agents/evolution/components/feedback-selector";

describe("feedback selector", () => {
  it("loads feedbacks and triggers evolution with selected ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "feedback-1",
          rating: 5,
          comment: "Bom ajuste",
          createdAt: "2026-03-21T00:00:00.000Z",
          originalContent: "Questão original",
          adaptedContent: "Questão adaptada",
          supportName: "Leitura guiada",
          dismissed: false,
          usedInEvolution: false,
        },
      ],
    });
    const onEvolve = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackSelector agentId="agent-1" isEvolving={false} onEvolve={onEvolve} />);

    await waitFor(() => {
      expect(screen.getByText("Leitura guiada")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /gerar sugestão/i }));

    expect(onEvolve).toHaveBeenCalledWith(["feedback-1"]);
  });
});
