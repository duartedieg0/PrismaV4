# Prisma UI Prototype Alignment Design

## Goal

Realinhar o frontend do `PrismaV2` com a linguagem visual do protótipo de referência, transformando o produto em uma interface mais clara, mais comercial e mais coesa entre landing, área do professor e área administrativa, sem alterar backend, fluxos ou contratos.

## Chosen Approach

Adotar a abordagem 3: reorientar todo o frontend para a estética clara e editorial do protótipo, usando-o como referência estrutural e visual, mas sem copiá-lo literalmente. O resultado deve ser um sistema de design unificado, com identidade verde-creme, hero mais forte, cards sólidos e shells internos mais limpos.

## Reference Translation

### What the Prototype Gets Right

- topbar flutuante, leve e compacta
- hero com copy curta e painel ilustrativo
- métricas logo abaixo do hero
- grade de capacidades com cards consistentes
- CTA final amplo e editorial
- superfícies claras com verde profundo como identidade

### What Must Be Preserved in PrismaV2

- sem mudanças funcionais
- sem alteração em rotas, handlers ou integrações
- sem dependência de assets externos não versionados
- acessibilidade e responsividade mantidas

## Visual System

### Color

- base clara em creme e off-white
- verde profundo como cor primária
- verde-menta suave para destaques, métricas e superfícies de apoio
- neutros quentes para texto secundário e bordas

### Typography

- sans mais forte e compacta para toda a interface
- títulos maiores, mais densos e com ritmo editorial
- mono apenas para dados e estados técnicos

### Surfaces

- reduzir blur e transparência excessiva
- usar cards sólidos, grandes e bem espaçados
- raio alto, sombra curta e borda muito leve

### Motion

- hover sutil, sem exagero de escala
- transições breves em cor, sombra e translate
- compatível com `prefers-reduced-motion`

## Layout Architecture

### Public

- topbar clara e fixa
- hero em duas colunas
- bloco de métricas após o hero
- seções de benefício e fluxo com cards maiores e mais regulares
- CTA final mais largo e institucional

### Teacher

- shell mais leve, com menos camadas visuais
- banner de contexto mais parecido com um “workspace intro”
- cards de dashboard, criação, revisão e resultado com linguagem próxima à landing

### Admin

- mesma família visual, porém mais densa
- tabelas e formulários com acabamento claro e governado
- navegação admin mais refinada, menos “app provisório”

## Execution Strategy

### 1. Rebase the Foundation

- atualizar paleta, tipografia, sombras, radius e estilos globais
- remover o excesso de aparência vítrea

### 2. Rebuild Navigation and Hero Surfaces

- alinhar topbars e hero público ao protótipo
- levar a mesma clareza estrutural aos shells autenticados

### 3. Recompose Main Screens

- landing
- dashboard
- nova prova
- extração
- resultado
- admin config e users

## Testing

O gate continua obrigatório:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

## Expected Outcome

O `PrismaV2` deve terminar com aparência muito mais próxima do protótipo desejado: comercial na entrada, profissional no uso diário e consistente em todas as telas, sem regressão funcional.
