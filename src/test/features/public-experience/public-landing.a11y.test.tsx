import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { BenefitsSection } from "@/features/public-experience/components/benefits-section";
import { FinalCta } from "@/features/public-experience/components/final-cta";
import { FlowSection } from "@/features/public-experience/components/flow-section";
import { PublicFaq } from "@/features/public-experience/components/public-faq";
import { PublicFooter } from "@/features/public-experience/components/public-footer";
import { PublicHero } from "@/features/public-experience/components/public-hero";
import { TrustStrip } from "@/features/public-experience/components/trust-strip";

function renderPublicLanding() {
  return render(
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

describe("public landing accessibility", () => {
  it("keeps the composed public experience accessible", async () => {
    const { container } = renderPublicLanding();

    expect((await axe(container)).violations).toHaveLength(0);
    expect(screen.getByRole("link", { name: /entrar com google/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /perguntas frequentes/i })).toBeInTheDocument();
  });
});
