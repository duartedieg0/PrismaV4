export type HeroContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export type TrustMetric = {
  value: string;
  label: string;
  detail: string;
};

export type BenefitItem = {
  title: string;
  description: string;
};

export type FlowStep = {
  step: string;
  title: string;
  description: string;
};

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  institution: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type CtaContent = {
  label: string;
  href: string;
  description: string;
};

export type FooterCopy = {
  brand: string;
  note: string;
  copyright: string;
};

export type FinalCtaContent = CtaContent & {
  title: string;
};

export const hero: HeroContent = {
  eyebrow: "Educação inclusiva com IA",
  title: "Provas adaptadas em minutos, não horas.",
  description:
    "A plataforma que ajuda professores a adaptar avaliações para estudantes com necessidades educacionais específicas — preservando objetivos pedagógicos com revisão humana garantida.",
};

export const trustMetrics: TrustMetric[] = [
  {
    value: "+2.400",
    label: "Avaliações adaptadas",
    detail: "desde o lançamento da plataforma",
  },
  {
    value: "85%",
    label: "Redução de tempo",
    detail: "em relação à adaptação manual",
  },
  {
    value: "4.9/5",
    label: "Satisfação dos professores",
    detail: "baseado em avaliações reais",
  },
];

export const trustSignals = [
  "desde o lançamento da plataforma",
  "em relação à adaptação manual",
  "baseado em avaliações reais",
] as const;

export const benefits: BenefitItem[] = [
  {
    title: "Economia de tempo real",
    description:
      "Reduza horas de trabalho manual para minutos. A IA gera adaptações instantâneas que você só precisa revisar.",
  },
  {
    title: "Rigor pedagógico preservado",
    description:
      "Os objetivos de aprendizagem são mantidos intactos. A adaptação muda a forma, nunca o conteúdo essencial.",
  },
  {
    title: "Múltiplas necessidades atendidas",
    description:
      "Dislexia, TDAH, deficiência visual, TEA e outras necessidades — tudo em uma única plataforma.",
  },
  {
    title: "Revisão humana garantida",
    description:
      "A IA sugere, o professor decide. Nenhuma adaptação é aplicada sem sua validação final.",
  },
];

export const flowSteps: FlowStep[] = [
  {
    step: "01",
    title: "Envie a avaliação",
    description:
      "Faça upload do PDF da prova e selecione as necessidades educacionais dos alunos que precisam de adaptação.",
  },
  {
    step: "02",
    title: "A IA adapta cada questão",
    description:
      "A inteligência artificial analisa cada questão e gera versões adaptadas preservando os objetivos pedagógicos.",
  },
  {
    step: "03",
    title: "Revise e aplique",
    description:
      "Confira as adaptações sugeridas, ajuste o que for necessário e exporte o resultado pronto para uso.",
  },
];

export const testimonials: TestimonialItem[] = [
  {
    quote:
      "Antes eu levava uma tarde inteira para adaptar uma prova de 10 questões. Agora faço em menos de 20 minutos e ainda consigo revisar com calma.",
    name: "Ana Luísa Martins",
    role: "Coordenadora Pedagógica",
    institution: "Colégio Estadual São Paulo",
  },
  {
    quote:
      "O que mais me impressionou foi que a IA realmente entende o objetivo da questão. As adaptações fazem sentido pedagogicamente.",
    name: "Ricardo Mendes",
    role: "Professor de Matemática",
    institution: "Escola Municipal Horizonte",
  },
  {
    quote:
      "Finalmente uma ferramenta que respeita o trabalho do professor. Eu continuo no controle, mas com muito mais agilidade.",
    name: "Camila Santos",
    role: "Professora de Ciências",
    institution: "Instituto Federal do Paraná",
  },
];

export const faq: FaqItem[] = [
  {
    question: "Como a plataforma adapta as avaliações?",
    answer:
      "Você faz upload da prova em PDF, seleciona as necessidades educacionais dos alunos e a IA gera adaptações que preservam os objetivos pedagógicos. Você revisa e ajusta antes de aplicar.",
  },
  {
    question: "A IA substitui a revisão do professor?",
    answer:
      "Não. A plataforma foi projetada para que o professor tenha a palavra final. A IA sugere adaptações, mas nenhuma é aplicada sem a validação humana.",
  },
  {
    question: "Quais necessidades educacionais são suportadas?",
    answer:
      "A plataforma suporta adaptações para dislexia, TDAH, deficiência visual, Transtorno do Espectro Autista (TEA), deficiência intelectual e outras necessidades educacionais específicas.",
  },
  {
    question: "Preciso instalar algum software?",
    answer:
      "Não. A plataforma funciona inteiramente no navegador. Basta acessar com sua conta Google e começar a adaptar.",
  },
  {
    question: "A plataforma é gratuita?",
    answer:
      "Sim, você pode começar a usar gratuitamente. Não é necessário cartão de crédito para criar sua conta e testar a plataforma.",
  },
];

export const primaryCta: CtaContent = {
  label: "Começar gratuitamente",
  href: "/login",
  description:
    "Crie sua conta em segundos com Google e comece a adaptar suas avaliações hoje.",
};

export const finalCta: FinalCtaContent = {
  title: "Pronto para transformar suas avaliações?",
  description:
    "Junte-se a milhares de professores que já economizam horas de trabalho com adaptações inteligentes.",
  label: "Começar agora — é gratuito",
  href: "/login",
};

export const footerCopy: FooterCopy = {
  brand: "Adapte Minha Prova",
  note: "Plataforma com inteligência artificial para apoiar professores na adaptação de avaliações com foco em educação inclusiva.",
  copyright: "Todos os direitos reservados.",
};
