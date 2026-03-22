import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentForm } from "@/features/admin/agents/components/agent-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

describe("agent form", () => {
  it("submits a create request and redirects back to the list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<AgentForm mode="create" />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Agente de teste" } });
    fireEvent.change(screen.getByLabelText("Objetivo"), { target: { value: "Objetivo" } });
    fireEvent.change(screen.getByLabelText("Prompt"), { target: { value: "Prompt inicial" } });
    fireEvent.click(screen.getByRole("button", { name: /criar agente/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/agents",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(push).toHaveBeenCalledWith("/config/agents");
  });
});
