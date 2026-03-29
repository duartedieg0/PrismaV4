import Link from "next/link";
import { Button } from "@/design-system/components/button";
import { BrowserFrame } from "@/design-system/components/browser-frame";

export function PublicHero() {
  return (
    <section className="bg-canvas">
      <div className="container-page grid gap-16 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
        {/* Left: Copy */}
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            Adapte avaliações em minutos, não horas.
          </h1>
          <p className="max-w-[540px] text-lg leading-relaxed text-text-secondary">
            O Adapte Minha Prova usa inteligência artificial para adaptar provas e avaliações
            para estudantes com necessidades educacionais específicas — mantendo o rigor
            pedagógico que você exige.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/login">
              <Button variant="primary" size="lg" className="rounded-full px-8">
                Comece agora
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button variant="outline" size="lg">
                Ver como funciona
              </Button>
            </a>
          </div>
        </div>

        {/* Right: Product mockup placeholder */}
        <div className="flex justify-center lg:justify-end">
          <BrowserFrame className="w-full max-w-lg animate-fade-in [transform:perspective(1200px)_rotateY(-2deg)]">
            <div className="flex h-64 items-center justify-center bg-surface-muted text-text-muted text-sm">
              Screenshot do produto (placeholder)
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}
