import Link from "next/link";
import { Button } from "@/design-system/components/button";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-surface-dark py-16 lg:py-24">
      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(55, 48, 163, 0.5) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="container-narrow relative flex flex-col items-center gap-6 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-inverse sm:text-3xl lg:text-4xl">
          Como a Inteligencia Artifical atua no processo de adaptação?
        </h2>
        <p className="max-w-lg text-lg text-white/70">
          Possuimos um conjunto de critérios neurocientíficos estabelecidos pelas principais instituições da área no mundo. Alem destas instruções, nosso modelo é atualizado pela própria plataforma através dos ciclos de melhorias.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/login">
            <Button variant="accent" size="lg" className="rounded-full px-8">
              Começar agora
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full border border-white/20 text-white/70 hover:bg-white/[0.08] hover:text-white"
            >
              Falar com a equipe
            </Button>
          </Link>
        </div>
        <p className="text-sm text-white/40">
           Gratuito para Testar · Versão Beta
        </p>
      </div>
    </section>
  );
}
