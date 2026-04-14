import { ScanText, BrainCircuit, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: ScanText,
    title: "Leitura e análise da prova",
    description:
      "A IA lê cada questão, identifica o conteúdo, o nível de complexidade e os objetivos pedagógicos envolvidos — sem perder o que o professor quis avaliar.",
  },
  {
    icon: BrainCircuit,
    title: "Adaptação por perfil do aluno",
    description:
      "Com base no perfil selecionado — como TEA, TDAH ou dislexia — a IA reescreve enunciados, simplifica estruturas e ajusta a linguagem para tornar a questão acessível.",
  },
  {
    icon: ShieldCheck,
    title: "Preservação dos objetivos pedagógicos",
    description:
      "A versão adaptada mantém o mesmo conteúdo, competência e habilidade da questão original. O aluno é avaliado pelo mesmo critério — com uma linguagem que ele consegue compreender.",
  },
];

export function AiSection() {
  return (
    <section id="ia" className="bg-brand-950 py-20">
      <div className="container-page">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-400">
            Inteligência Artificial
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Como a IA atua no processo de adaptação?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            A adaptação não é uma tradução automática. É um processo guiado por contexto pedagógico — e a IA foi treinada para entender essa diferença.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-8"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/20">
                  <step.icon className="h-5 w-5 text-brand-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
                  Etapa {index + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
