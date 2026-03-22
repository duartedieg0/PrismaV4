import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminConfigPage from "@/app/(admin)/config/page";

describe("admin config home", () => {
  it("renders the main config sections", () => {
    render(<AdminConfigPage />);

    expect(screen.getAllByText("Modelos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Agentes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Apoios").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Disciplinas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Anos/Séries").length).toBeGreaterThan(0);
  });
});
