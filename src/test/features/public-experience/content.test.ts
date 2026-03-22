import { describe, expect, it } from "vitest";
import {
  benefits,
  flowSteps,
  footerCopy,
  hero,
  primaryCta,
  faq,
  trustSignals,
  finalCta,
} from "@/features/public-experience/content";

describe("public experience content contract", () => {
  it("defines a PT-BR hero with a clear value proposition", () => {
    expect(hero).toMatchObject({
      eyebrow: "Landing pública",
      title: "Adapte avaliações em minutos, não horas.",
      description:
        "Ferramenta para professores que precisam adaptar provas para estudantes com necessidades educacionais específicas, mantendo os objetivos pedagógicos.",
    });
  });

  it("exposes trust signals for the public landing", () => {
    expect(trustSignals).toEqual([
      "Revisão humana do professor",
      "Suporte a múltiplas necessidades educacionais",
      "Preserva objetivos pedagógicos",
    ]);
  });

  it("defines the landing flow in three steps", () => {
    expect(flowSteps).toHaveLength(3);
    expect(flowSteps).toEqual([
      {
        step: "01",
        title: "Envie sua prova",
        description:
          "Faça upload do PDF da prova e selecione as necessidades educacionais dos seus alunos.",
      },
      {
        step: "02",
        title: "IA adapta as questões",
        description:
          "A inteligência artificial analisa cada questão e gera versões adaptadas sem perder o objetivo pedagógico.",
      },
      {
        step: "03",
        title: "Revise e copie o resultado",
        description:
          "Confira as adaptações, ajuste o que precisar e copie o texto para seu documento.",
      },
    ]);
  });

  it("covers concrete pedagogical benefits", () => {
    expect(benefits).toEqual([
      "Economize tempo na adaptação de avaliações.",
      "Mantenha o rigor pedagógico e o foco na aprendizagem.",
      "Atenda diferentes necessidades educacionais com mais clareza.",
      "Leve a revisão humana para a etapa final de cada entrega.",
    ]);
  });

  it("keeps the FAQ concise and useful", () => {
    expect(faq).toHaveLength(3);
    expect(faq).toEqual([
      {
        question: "Como a plataforma ajuda na adaptação das provas?",
        answer:
          "Você envia a prova, informa o contexto dos alunos e recebe uma base adaptada para revisar antes de usar.",
      },
      {
        question: "As adaptações substituem a revisão do professor?",
        answer:
          "Não. O professor continua no controle da decisão final e valida o resultado antes de aplicar a avaliação.",
      },
      {
        question: "A solução atende diferentes necessidades educacionais?",
        answer:
          "Sim. O conteúdo da landing deixa claro o suporte a múltiplas necessidades sem restringir o uso a um único perfil.",
      },
    ]);
  });

  it("defines the primary and final CTAs", () => {
    expect(primaryCta).toEqual({
      label: "Entrar com Google",
      href: "/login",
      description:
        "Acesse a plataforma com sua conta institucional ou Google e comece a adaptar.",
    });

    expect(finalCta).toEqual({
      title: "Pronto para adaptar suas provas com mais segurança?",
      description:
        "Entre com sua conta e transforme sua rotina de adaptação sem abrir mão da revisão humana.",
      label: "Começar agora",
      href: "/login",
    });
  });

  it("closes with institutional footer copy", () => {
    expect(footerCopy).toEqual({
      brand: "Adapte Minha Prova",
      note: "Plataforma para apoiar professores na adaptação de avaliações com foco pedagógico e educação inclusiva.",
      copyright: "Todos os direitos reservados.",
    });
  });
});
