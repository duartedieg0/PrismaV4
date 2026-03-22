import { SectionShell } from "@/design-system/components/section-shell";
import { BenefitsSection } from "@/features/public-experience/components/benefits-section";
import { FinalCta } from "@/features/public-experience/components/final-cta";
import { FlowSection } from "@/features/public-experience/components/flow-section";
import { PublicFaq } from "@/features/public-experience/components/public-faq";
import { PublicFooter } from "@/features/public-experience/components/public-footer";
import { PublicHero } from "@/features/public-experience/components/public-hero";
import { TrustStrip } from "@/features/public-experience/components/trust-strip";

type StaticPageProps = {
  params: Promise<Record<string, never>>;
};

export default function PublicHomePage(_: StaticPageProps) {
  return (
    <SectionShell width="xwide">
      <div style={{ display: "grid", gap: "2.5rem" }}>
        <PublicHero />
        <TrustStrip />
        <BenefitsSection />
        <FlowSection />
        <PublicFaq />
        <FinalCta />
        <PublicFooter />
      </div>
    </SectionShell>
  );
}
