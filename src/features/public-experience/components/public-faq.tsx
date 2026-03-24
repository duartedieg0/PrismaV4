import { Card } from "@/design-system/components/card";
import { Avatar } from "@/design-system/components/avatar";
import { Badge } from "@/design-system/components/badge";
import { Quote } from "lucide-react";

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

export function PublicFaq() {
  return (
    <section id="depoimentos" className="py-20 lg:py-24">
      <div className="container-page">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <Badge variant="outline">Depoimentos</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">
            O que dizem os professores
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} variant="default" padding="lg" hover>
              <div className="flex flex-col gap-4">
                <Quote className="h-8 w-8 text-brand-200" />
                <p className="text-sm leading-relaxed text-text-secondary italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-auto flex items-center gap-3 border-t border-border-default pt-4">
                  <Avatar name={t.name} size="md" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary">{t.name}</span>
                    <span className="text-xs text-text-muted">{t.role}</span>
                    <span className="text-xs text-text-muted">{t.school}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
