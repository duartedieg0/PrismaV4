import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { PromptComparator } from "@/features/admin/agents/evolution/components/prompt-comparator";

describe("prompt comparator a11y", () => {
  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <PromptComparator
        agentId="agent-1"
        commentary="Comentário"
        currentVersion={2}
        evolutionId="550e8400-e29b-41d4-a716-446655440000"
        onComplete={() => {}}
        originalPrompt="Prompt atual"
        suggestedPrompt="Prompt sugerido"
        suggestedVersion={3}
      />,
    );

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
