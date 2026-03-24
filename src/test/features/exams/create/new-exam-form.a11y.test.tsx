import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { NewExamForm } from "@/features/exams/create/components/new-exam-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("new exam form accessibility", () => {
  it("keeps the intake form accessible", async () => {
    const { container } = render(
      <NewExamForm
        subjects={[
          { id: "550e8400-e29b-41d4-a716-446655440000", name: "Matemática" },
        ]}
        gradeLevels={[
          { id: "550e8400-e29b-41d4-a716-446655440001", name: "7º ano" },
        ]}
        supports={[
          { id: "550e8400-e29b-41d4-a716-446655440002", name: "Dislexia" },
        ]}
      />,
    );

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
