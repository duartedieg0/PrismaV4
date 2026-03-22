import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { benefits, faq, flowSteps, finalCta, footerCopy, hero, primaryCta } from "@/features/public-experience/content";
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

    expect(screen.getByRole("heading", { level: 1, name: hero.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: primaryCta.label })).toHaveAttribute("href", primaryCta.href);
    expect(screen.getByText(hero.description)).toBeInTheDocument();
    expect(screen.getByText(hero.eyebrow)).toBeInTheDocument();
  });

  it("renders the flow in three explicit steps", () => {
    renderPublicLanding();

    const flow = screen.getByRole("region", { name: /como funciona/i });
    const steps = within(flow).getAllByRole("listitem");

    expect(steps).toHaveLength(3);
    expect(flowSteps).toHaveLength(3);
    expect(within(flow).getByText("01")).toBeInTheDocument();
    expect(within(flow).getByText("02")).toBeInTheDocument();
    expect(within(flow).getByText("03")).toBeInTheDocument();
  });

  it("keeps the benefits legible and the FAQ accessible", () => {
    renderPublicLanding();

    const benefitsRegion = screen.getByRole("region", { name: /benefícios/i });
    const faqRegion = screen.getByRole("region", { name: /perguntas frequentes/i });

    expect(within(benefitsRegion).getAllByRole("listitem")).toHaveLength(benefits.length);
    expect(within(faqRegion).getAllByRole("group")).toHaveLength(faq.length);
    expect(
      faq.map((item) => within(faqRegion).getByText(item.question)),
    ).toHaveLength(faq.length);
    expect(screen.getByText(finalCta.title)).toBeInTheDocument();
  });

  it("closes with an institutional footer and a valid heading order", () => {
    renderPublicLanding();

    expect(screen.getByText(footerCopy.brand)).toBeInTheDocument();
    expect(screen.getByText(footerCopy.note)).toBeInTheDocument();
    expect(screen.getByText(footerCopy.copyright)).toBeInTheDocument();

    const headings = screen.getAllByRole("heading");
    expect(headings[0]).toHaveTextContent(hero.title);
    expect(headings.some((heading) => heading.textContent === finalCta.title)).toBe(true);
  });
});
