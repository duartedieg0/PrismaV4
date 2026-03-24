import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UsersTable } from "@/features/admin/users/components/users-table";

describe("users table", () => {
  it("renders users and confirms a governance action", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "user-1",
        fullName: "Professor Um",
        email: "prof@example.com",
        avatarUrl: null,
        role: "teacher",
        blocked: true,
        createdAt: "2026-03-21T00:00:00.000Z",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <UsersTable
        initialUsers={[
          {
            id: "user-1",
            fullName: "Professor Um",
            email: "prof@example.com",
            avatarUrl: null,
            role: "teacher",
            blocked: false,
            createdAt: "2026-03-21T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Professor Um")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /bloquear/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /^bloquear$/i })[1]!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/users/user-1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });
});
