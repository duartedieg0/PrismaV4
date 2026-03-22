# Prisma UI Refresh Design

## Goal

Estabelecer uma linguagem visual única e consistente para todo o `PrismaV2`, cobrindo landing, área autenticada do professor e área administrativa, sem alterar fluxos de negócio, contratos de backend ou rotas.

## Constraints

- O backend não pode ser alterado.
- Os fluxos existentes devem permanecer semanticamente idênticos.
- Os testes atuais precisam continuar válidos após a refatoração.
- A consistência visual deve ser construída a partir do design system existente, não por exceções tela a tela.

## Recommended Approach

Adotar uma direção de SaaS educacional editorial: superfícies claras em camadas, hierarquia tipográfica forte, navegação mais previsível e uma família visual única para todas as áreas do produto. A landing permanece mais narrativa, a área do professor enfatiza fluxo e progresso, e o admin privilegia densidade e legibilidade, mas todos dentro do mesmo sistema.

## Visual Direction

### Brand Character

- Produto educacional premium, analítico e confiável
- Clareza operacional antes de ornamentação
- Profundidade visual sutil, sem excesso de efeitos

### Color System

- Base em índigo e ardósia para identidade e navegação
- Acento esmeralda para ações principais e estados positivos
- Âmbar para atenção e avisos
- Fundos claros com gradientes suaves e contraste suficiente para leitura prolongada

### Typography

- Sans principal para interface e leitura
- Uso pontual de mono para métricas, identificadores e affordances técnicas
- Títulos com peso e escala mais distintos entre seções

### Surfaces and Motion

- Painéis sólidos com borda fina e sombra controlada
- Cabeçalhos e banners mais estruturados
- Microinterações em `transform` e `opacity`, respeitando `prefers-reduced-motion`

## UI Architecture

### Foundation

Refatorar `globals.css`, tokens semânticos e primitivas compartilhadas para centralizar:

- paleta semântica
- spacing e radius
- sombras e bordas
- densidade de layout
- estados visuais padronizados

### Shells

- `public-shell`: storytelling, confiança e CTA
- `teacher-shell`: fluxo, contexto da página e ações frequentes
- `admin-shell`: navegação densa, orientação tabular e ações de governança

### Shared Components

Os componentes abaixo passam a ser a espinha dorsal do redesign:

- `page-header`
- `surface`
- `section-shell`
- `status-badge`
- `empty-state`
- `error-state`
- `loading-state`
- `processing-banner`
- `data-table-wrapper`

## Rollout Strategy

### 1. Foundation First

Reescrever tokens, estilos globais e shells antes de reaplicar padrões às páginas. Isso reduz divergência e evita soluções ad hoc por tela.

### 2. High-Impact Screens

Aplicar primeiro às superfícies com maior percepção do usuário:

- landing
- login e blocked
- dashboard
- nova prova
- processamento, extração e resultado

### 3. Admin Consolidation

Reaplicar o mesmo sistema visual em:

- `/config`
- CRUDs administrativos
- `/users`
- evolução de agentes

## Error Handling and UX Safeguards

- Nenhuma refatoração deve alterar estados lógicos de loading, error e empty
- Componentes interativos continuam acessíveis por teclado
- Falhas de carregamento permanecem explícitas e próximas do contexto
- Estados de longa execução mantêm feedback visual estável

## Testing Strategy

- Validar visualmente sem alterar as expectativas semânticas dos testes
- Manter cobertura existente de unit, a11y e E2E
- Executar o gate completo ao fim da refatoração:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test`
  - `npm run test:a11y`
  - `npm run test:e2e`

## Expected Outcome

O `PrismaV2` deve terminar com uma linguagem visual coesa, mais profissional e mais previsível entre telas, pronto para testes com usuários sem regressão funcional.
