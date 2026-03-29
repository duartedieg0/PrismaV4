import { Timer, ShieldCheck, Layers, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Timer,
    title: "Economia de tempo",
    description: "Reduza de horas para minutos o tempo gasto adaptando avaliações. Mais tempo para o que importa: ensinar.",
    highlight: true,
  },
  {
    icon: ShieldCheck,
    title: "Rigor pedagógico",
    description: "As adaptações mantêm os objetivos de aprendizagem, competências e habilidades da avaliação original.",
    highlight: false,
  },
  {
    icon: Layers,
    title: "Múltiplas necessidades",
    description: "TDAH, Dislexia, TEA, Deficiência Visual e mais — gere adaptações específicas para cada necessidade.",
    highlight: false,
  },
  {
    icon: UserCheck,
    title: "Revisão humana",
    description: "A IA sugere, mas a decisão final é sempre sua. Revise, ajuste e aprove cada adaptação antes de usar.",
    highlight: false,
  },
];

export function BenefitsSection() {
  return (
    <section id="recursos" className="bg-surface-muted py-20">
      <div className="container-page">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-text-primary">
          Por que escolher o Prisma
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={cn(
                "rounded-xl border border-border-default bg-white p-8 shadow-soft transition-shadow duration-200 hover:shadow-card",
                feature.highlight && "border-l-[3px] border-l-accent-500",
              )}
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <feature.icon className="h-7 w-7 text-brand-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-text-primary">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
