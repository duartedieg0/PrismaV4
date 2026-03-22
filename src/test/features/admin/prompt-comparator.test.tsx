import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromptComparator } from "@/features/admin/agents/evolution/components/prompt-comparator";

describe("prompt comparator", () => {
  it("accepts an evolution suggestion", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    });
    const onComplete = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(
      <PromptComparator
        agentId="agent-1"
        commentary="Comentário"
        currentVersion={2}
        evolutionId="550e8400-e29b-41d4-a716-446655440000"
        onComplete={onComplete}
        originalPrompt="Prompt atual"
        suggestedVersion={3}
        suggestedPrompt="Novo prompt"
      />,
    );

    expect(screen.getByText(/promoção de versão: v2 -> v3/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /aceitar sugestão/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/agents/agent-1/evolve",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    expect(onComplete).toHaveBeenCalled();
  });
});
