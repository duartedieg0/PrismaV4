import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "@/design-system/components/brand-mark";

describe("BrandMark", () => {
  it("renders the product name and editorial descriptor", () => {
    render(<BrandMark />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /adapte minha prova/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/plataforma educacional com ia/i)).toBeInTheDocument();
  });
});
