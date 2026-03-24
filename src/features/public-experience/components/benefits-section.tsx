import { Card } from "@/design-system/components/card";
import { Badge } from "@/design-system/components/badge";
import { Timer, ShieldCheck, Layers, UserCheck } from "lucide-react";

const features = [
  {
    icon: Timer,
    title: "Economia de tempo",
    description: "Reduza de horas para minutos o tempo gasto adaptando avaliações. Mais tempo para o que importa: ensinar.",
  },
  {
    icon: ShieldCheck,
    title: "Rigor pedagógico",
    description: "As adaptações mantêm os objetivos de aprendizagem, competências e habilidades da avaliação original.",
  },
  {
    icon: Layers,
    title: "Múltiplas necessidades",
    description: "TDAH, Dislexia, TEA, Deficiência Visual e mais — gere adaptações específicas para cada necessidade em uma única operação.",
  },
  {
    icon: UserCheck,
    title: "Revisão humana",
    description: "A IA sugere, mas a decisão final é sempre sua. Revise, ajuste e aprove cada adaptação antes de usar.",
  },
];

export function BenefitsSection() {
  return (
    <section id="recursos" className="bg-surface-muted/30 py-20 lg:py-24">
      <div className="container-page">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <Badge variant="outline">Recursos</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">
            Feito para quem ensina
          </h2>
          <p className="max-w-2xl text-text-secondary">
            Cada recurso foi pensado para se encaixar no fluxo real do professor, sem complicação.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} variant="default" padding="lg" hover>
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <feature.icon className="h-6 w-6" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-text-primary">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
