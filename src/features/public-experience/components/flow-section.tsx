import { Card } from "@/design-system/components/card";
import { Badge } from "@/design-system/components/badge";
import { Upload, Cpu, ClipboardCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Envie sua prova",
    description:
      "Faça upload do PDF da avaliação e selecione as necessidades educacionais dos seus alunos. O sistema aceita qualquer formato de prova.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "IA adapta as questões",
    description:
      "Nossa inteligência artificial analisa cada questão e gera versões adaptadas para TDAH, Dislexia, TEA e outras necessidades — preservando os objetivos pedagógicos.",
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "Revise e copie",
    description:
      "Revise as adaptações sugeridas, ajuste conforme necessário e exporte o resultado. Você mantém o controle total do processo.",
  },
];

export function FlowSection() {
  return (
    <section id="como-funciona" className="py-20 lg:py-24">
      <div className="container-page">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <Badge variant="outline">Como funciona</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">
            Três passos para adaptar suas provas
          </h2>
          <p className="max-w-2xl text-text-secondary">
            Um fluxo simples e intuitivo que coloca a inteligência artificial a serviço da inclusão educacional.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.number} variant="default" padding="lg" hover className="relative">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="font-code text-xs font-bold text-text-muted">PASSO {step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{step.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
