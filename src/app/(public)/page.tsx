import { BenefitsSection } from "@/features/public-experience/components/benefits-section";
import { FinalCta } from "@/features/public-experience/components/final-cta";
import { FlowSection } from "@/features/public-experience/components/flow-section";
import { PublicFaq } from "@/features/public-experience/components/public-faq";
import { PublicFooter } from "@/features/public-experience/components/public-footer";
import { PublicHero } from "@/features/public-experience/components/public-hero";
import { TestimonialsSection } from "@/features/public-experience/components/testimonials-section";
import { TrustStrip } from "@/features/public-experience/components/trust-strip";

type StaticPageProps = {
  params: Promise<Record<string, never>>;
};

export default function PublicHomePage(_: StaticPageProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "0 var(--space-gutter)",
      }}
    >
      <div
        style={{
          width: "min(100%, var(--container-xwide))",
          margin: "0 auto",
          display: "grid",
          gap: "1rem",
        }}
      >
        <PublicHero />
        <TrustStrip />
        <BenefitsSection />
        <FlowSection />
        <TestimonialsSection />
        <PublicFaq />
        <FinalCta />
        <PublicFooter />
      </div>
    </main>
  );
}
