import { Upload, Cpu, ClipboardCheck } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Upload,
    title: "Envie sua prova",
    description: "Faça upload do PDF da avaliação e selecione as necessidades educacionais dos seus alunos.",
  },
  {
    number: "2",
    icon: Cpu,
    title: "IA adapta as questões",
    description: "A inteligência artificial analisa cada questão e gera versões adaptadas preservando os objetivos pedagógicos.",
  },
  {
    number: "3",
    icon: ClipboardCheck,
    title: "Revise e copie",
    description: "Revise as adaptações sugeridas, ajuste conforme necessário e copie o resultado.",
  },
];

export function FlowSection() {
  return (
    <section id="como-funciona" className="bg-white py-20">
      <div className="container-page">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-text-primary">
          Como funciona
        </h2>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Dashed connector line (desktop only) */}
          <div
            className="absolute left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] top-5 hidden h-px border-t border-dashed border-border-default md:block"
            aria-hidden="true"
          />

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              {/* Number circle */}
              <div className="relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {step.number}
              </div>

              {/* Card */}
              <div className="rounded-xl border border-border-default bg-white p-6 shadow-xs">
                <step.icon className="mx-auto mb-3 h-6 w-6 text-brand-500" />
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
