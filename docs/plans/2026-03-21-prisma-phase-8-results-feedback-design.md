# Prisma Phase 8 Results, Copy and Feedback Design

## Objective

Entregar a superfície final de valor ao professor depois da conclusão do processamento da prova, cobrindo visualização de resultado, cópia orientada a uso e captura de feedback com sinais de uso para o learning loop.

## Scope

Esta fase cobre:

- tela de processamento para exames ainda não concluídos;
- tela final de resultado para exames concluídos;
- view model canônico de resultado por exame, questão e support;
- utilitários de cópia por adaptação e por prova consolidada;
- fluxo de feedback com persistência idempotente;
- eventos observáveis de visualização, cópia e feedback;
- exposição de BNCC e Bloom quando disponíveis no resultado persistido.

Esta fase não cobre:

- edição inline da adaptação pronta;
- dashboards analíticos genéricos;
- uso administrativo dos feedbacks para evolução de agentes, que pertence à fase posterior.

## Recommended Approach

Implementar uma superfície completa de resultado apoiada por um serviço central de leitura e por um fluxo separado de feedback/telemetria. A UI consome apenas dados persistidos pela Fase 7, sem recomputar IA nem acoplar a camada de apresentação ao runtime Mastra.

## Architecture

```text
Completed exam
  -> getExamResult service
  -> exam/question/adaptation result view model
  -> result + processing pages
  -> copy actions + feedback submission
  -> persisted feedback + observable usage events
```

### Module shape

```text
src/features/exams/results/
  contracts.ts
  get-exam-result.ts
  copyable-block.ts
  record-result-event.ts
  components/
    processing-status.tsx
    result-page.tsx
    question-result.tsx
    adaptation-result-card.tsx
    feedback-form.tsx
    copy-action-bar.tsx
```

### Data ownership

- leitura consolidada do resultado: service `getExamResult`
- formatação copiável: utilitário puro
- persistência de feedback: route handler
- eventos observáveis: service separado, não bloqueante para a UX

## Data Flow

### Processing

1. Professor acessa uma prova ainda não concluída.
2. A página de processamento exibe status atual e progresso consolidado.
3. Quando o exame está em `completed`, a jornada de navegação aponta para `/exams/[id]/result`.

### Result

1. A rota valida ownership e status do exame.
2. `getExamResult` carrega:
   - metadados do exame;
   - questões originais;
   - adaptações por support;
   - BNCC/Bloom;
   - feedback existente;
   - blocos copiáveis derivados.
3. A UI organiza a leitura por questão, com alternância de support e ações de cópia.
4. A abertura da tela registra `result_viewed`.

### Copy and feedback

1. O professor pode copiar:
   - adaptação atual;
   - alternativas adaptadas;
   - prova consolidada por support.
2. A cópia registra `adaptation_copied` ou `exam_copy_compiled`.
3. O professor envia ou atualiza feedback por adaptação.
4. O sistema persiste o feedback e registra `feedback_submitted`.

## Error Handling

- exame inexistente: `404`;
- exame de outro usuário: `403`;
- exame não concluído: tela/processamento explícito, sem resultado parcial ambíguo;
- adaptação individual com erro: estado local por support, sem quebrar a questão inteira;
- falha de cópia: mensagem estável e UX preservada;
- falha de feedback: manter input e exibir erro inline;
- falha de registro de evento: não quebrar a UX principal.

## Testing Strategy

- unit para `getExamResult` e `copyable-block`;
- unit para registro de evento observável;
- integration para `POST /api/exams/[id]/feedback`;
- UI tests para processamento e resultado;
- a11y para as duas superfícies;
- E2E para abrir resultado, copiar e enviar feedback, respeitando os `skips` autenticados já aceitos quando dependentes da dívida de infra.

## Technical Notes

- a tela de resultado deve consumir apenas estado persistido pela Fase 7;
- eventos de uso devem ser modelados de forma compatível com governança futura, mas sem criar um sistema genérico de analytics agora;
- a formatação copiável deve ser pura, testável e desacoplada da UI;
- feedback deve carregar contexto suficiente para uso futuro no learning loop: adaptação, support, agente, prompt e modelo quando disponíveis.
