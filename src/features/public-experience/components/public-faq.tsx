const testimonials = [
  {
    name: "Maria Silva",
    role: "Professora de Matemática",
    school: "Escola Municipal São Paulo",
    quote: "Antes eu gastava um fim de semana inteiro adaptando provas. Com o Prisma, faço em 20 minutos e com mais qualidade.",
  },
  {
    name: "Carlos Oliveira",
    role: "Coordenador Pedagógico",
    school: "Colégio Estadual Rio de Janeiro",
    quote: "A plataforma entende as necessidades de cada aluno. As adaptações para TDAH são especialmente bem feitas.",
  },
  {
    name: "Ana Santos",
    role: "Professora de Português",
    school: "Instituto Federal de Minas Gerais",
    quote: "O melhor é que eu mantenho o controle. A IA sugere, mas eu decido. Isso me dá confiança para usar no dia a dia.",
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function PublicFaq() {
  return (
    <section id="depoimentos" className="bg-white py-20">
      <div className="container-page">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-text-primary">
          O que dizem os professores
        </h2>

        {/* Desktop: grid, Mobile: horizontal scroll */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="min-w-[280px] shrink-0 snap-center rounded-xl border border-border-default bg-white p-7 shadow-xs md:min-w-0"
            >
              <div className="flex flex-col gap-4">
                {/* Decorative quote */}
                <span className="text-4xl font-extrabold leading-none text-brand-100" aria-hidden="true">
                  &ldquo;
                </span>

                <p className="text-sm italic leading-[1.7] text-text-secondary">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Separator */}
                <div className="my-2 h-px bg-border-muted" />

                {/* Attribution */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                    {getInitials(t.name)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary">{t.name}</span>
                    <span className="text-xs text-text-muted">{t.role} · {t.school}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
