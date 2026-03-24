import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicHomePage from "@/app/(public)/page";

describe("public home page", () => {
  it("renders the rebuilt public landing for anonymous users", () => {
    render(<PublicHomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/adapte avaliações/i)).toBeInTheDocument();
    expect(screen.getAllByText(/comece grátis/i).length).toBeGreaterThan(0);
  });
});
