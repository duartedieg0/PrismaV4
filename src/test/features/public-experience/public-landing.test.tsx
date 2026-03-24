import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BenefitsSection } from "@/features/public-experience/components/benefits-section";
import { FinalCta } from "@/features/public-experience/components/final-cta";
import { FlowSection } from "@/features/public-experience/components/flow-section";
import { PublicFaq } from "@/features/public-experience/components/public-faq";
import { PublicFooter } from "@/features/public-experience/components/public-footer";
import { PublicHero } from "@/features/public-experience/components/public-hero";
import { TrustStrip } from "@/features/public-experience/components/trust-strip";

function renderPublicLanding() {
  render(
    <>
      <PublicHero />
      <TrustStrip />
      <FlowSection />
      <BenefitsSection />
      <PublicFaq />
      <FinalCta />
      <PublicFooter />
    </>,
  );
}

describe("public landing composition", () => {
  it("exposes the login CTA in the hero and keeps the public content readable", () => {
    renderPublicLanding();

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/adapte avaliações em/i)).toBeInTheDocument();
    expect(screen.getAllByText(/comece grátis/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/plataforma educacional/i).length).toBeGreaterThan(0);
  });

  it("renders the flow in three explicit steps", () => {
    renderPublicLanding();

    expect(screen.getByText(/três passos para adaptar/i)).toBeInTheDocument();
    expect(screen.getByText(/envie sua prova/i)).toBeInTheDocument();
    expect(screen.getByText(/ia adapta as questões/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /revise e copie/i })).toBeInTheDocument();
  });

  it("keeps the benefits legible and the FAQ accessible", () => {
    renderPublicLanding();

    expect(screen.getByRole("heading", { name: /economia de tempo/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rigor pedagógico/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /múltiplas necessidades/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /revisão humana/i })).toBeInTheDocument();
    expect(screen.getByText(/o que dizem os professores/i)).toBeInTheDocument();
  });

  it("closes with an institutional footer and a valid heading order", () => {
    renderPublicLanding();

    expect(screen.getByText(/todos os direitos reservados/i)).toBeInTheDocument();
    expect(screen.getByText(/pronto para transformar/i)).toBeInTheDocument();

    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(3);
    expect(headings[0].tagName).toBe("H1");
  });
});
