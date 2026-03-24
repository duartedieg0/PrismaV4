import Link from "next/link";
import { Button } from "@/design-system/components/button";
import { Logo } from "@/design-system/components/logo";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-surface-terminal py-20 lg:py-24">
      {/* Glow effects */}
      <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-brand-400/10 blur-3xl" aria-hidden="true" />

      <div className="container-narrow relative flex flex-col items-center gap-6 text-center">
        <Logo variant="mark" size="lg" className="animate-pulse-glow" />
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Pronto para transformar{" "}
          <span className="text-brand-400 text-glow">suas avaliações</span>?
        </h2>
        <p className="max-w-lg text-lg text-slate-300">
          Comece a adaptar provas com inteligência artificial hoje mesmo. O professor mantém o controle, a IA faz o trabalho pesado.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/login">
            <Button variant="primary" size="lg">Começar agora</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="lg" className="text-slate-300 hover:text-white hover:bg-white/10">
              Falar com a equipe
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          Sem cartão de crédito · Gratuito para testar · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
