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
          Comece a adaptar suas avaliações hoje
        </h2>
        <p className="max-w-lg text-lg text-brand-200">
          Entre com sua conta e transforme sua rotina de adaptação sem abrir mão da revisão humana.
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
              className="rounded-full border border-brand-200/30 text-brand-200 hover:bg-white/[0.08] hover:text-white"
            >
              Falar com a equipe
            </Button>
          </Link>
        </div>
        <p className="text-sm text-brand-400/60">
          Sem cartão de crédito · Gratuito para testar · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
