import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicHomePage from "@/app/(public)/page";
import { finalCta, hero } from "@/features/public-experience/content";

describe("public home page", () => {
  it("renders the rebuilt public landing for anonymous users", () => {
    render(<PublicHomePage params={Promise.resolve({})} />);

    expect(screen.getByRole("heading", { level: 1, name: hero.title })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /como funciona/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /benefícios/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /perguntas frequentes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: finalCta.label })).toHaveAttribute("href", "/login");
  });
});
