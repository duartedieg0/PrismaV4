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
            <em className="italic text-brand-600">Sua prova</em> já está pronta. A do <em className="italic text-brand-600">seu</em> <em className="italic text-brand-600">aluno</em> também.
          </h1>
          <p className="max-w-[540px] text-lg leading-relaxed text-text-secondary">
            Transforme suas provas em versões acessíveis para cada perfil de aluno — preservando seus objetivos pedagógicos.
          </p>
          <p className="max-w-[540px] text-base leading-relaxed text-text-secondary border-l-2 border-brand-600 pl-4 italic">
            O Adapta Prova foi feito por e para professores. Sabemos o quanto você carrega — querermos que a inclusão seja leve.
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
              
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}
