import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { UsersTable } from "@/features/admin/users/components/users-table";

describe("users page accessibility", () => {
  it("keeps the governance table accessible", async () => {
    const { container } = render(
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

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
