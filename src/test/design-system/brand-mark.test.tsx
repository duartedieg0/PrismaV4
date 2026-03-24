import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "@/design-system/components/brand-mark";

describe("BrandMark", () => {
  it("renders the product name and editorial descriptor", () => {
    render(<BrandMark />);

    expect(screen.getByText(/minha prova/i)).toBeInTheDocument();
    expect(screen.getByText(/plataforma educacional/i)).toBeInTheDocument();
  });
});
