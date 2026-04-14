import { PublicNavbar } from "@/features/public-experience/components/public-navbar";
import { PublicHero } from "@/features/public-experience/components/public-hero";
import { TrustStrip } from "@/features/public-experience/components/trust-strip";
import { FlowSection } from "@/features/public-experience/components/flow-section";
import { BenefitsSection } from "@/features/public-experience/components/benefits-section";
import { PublicFaq } from "@/features/public-experience/components/public-faq";
import { FinalCta } from "@/features/public-experience/components/final-cta";
import { PublicFooter } from "@/features/public-experience/components/public-footer";

export default function PublicHomePage() {
  return (
    <>
      <PublicNavbar />
      <main>
        <PublicHero />
        <FlowSection />
        <BenefitsSection />
        <FinalCta />
      </main>
      <PublicFooter />
    </>
  );
}
