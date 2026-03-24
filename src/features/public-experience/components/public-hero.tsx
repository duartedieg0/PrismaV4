import Link from "next/link";
import { Button } from "@/design-system/components/button";
import { Badge } from "@/design-system/components/badge";
import { TerminalBlock, TerminalLine } from "@/design-system/components/terminal-block";

export function PublicHero() {
  return (
    <section className="relative overflow-hidden bg-surface-terminal">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #34d399 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" aria-hidden="true" />

      <div className="container-page relative grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
        {/* Left: Copy */}
        <div className="flex flex-col gap-6">
          <Badge variant="terminal" size="md">Plataforma educacional com IA</Badge>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Adapte avaliações em{" "}
            <span className="text-brand-400 text-glow">minutos</span>
            , não horas.
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-slate-300">
            O Adapte Minha Prova usa inteligência artificial para adaptar provas e avaliações
            para estudantes com necessidades educacionais específicas — mantendo o rigor
            pedagógico que você exige.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/login">
              <Button variant="primary" size="lg">Comece grátis</Button>
            </Link>
            <a href="#como-funciona">
              <Button variant="ghost" size="lg" className="text-slate-300 hover:text-white hover:bg-white/10">
                Ver demonstração
              </Button>
            </a>
          </div>
        </div>

        {/* Right: Terminal mockup */}
        <div className="flex justify-center lg:justify-end">
          <TerminalBlock title="prisma" className="w-full max-w-lg animate-fade-in">
            <div className="flex flex-col gap-3">
              <TerminalLine prompt="$" command="prisma adapt --exam prova-6ano.pdf" />
              <div className="flex flex-col gap-1 pl-5">
                <span className="text-brand-400">✓ 12 questões extraídas com sucesso</span>
                <span className="text-amber-400">⟳ Gerando adaptações para TDAH, Dislexia...</span>
                <span className="text-brand-400">✓ 3 versões adaptadas prontas</span>
              </div>
              <TerminalLine prompt="$" command="prisma export --format pdf" />
              <div className="pl-5">
                <span className="text-slate-400">→ prova-6ano-adaptada.pdf salvo com sucesso</span>
              </div>
            </div>
          </TerminalBlock>
        </div>
      </div>
    </section>
  );
}
