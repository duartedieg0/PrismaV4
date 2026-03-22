# Prisma Phase 10 Admin Users and Governance Design

## Objective

Formalizar a gestão administrativa de usuários com controles fortes e explícitos, cobrindo listagem, bloqueio, desbloqueio, mudança de papel e trilha de auditoria persistida.

## Scope

Esta fase cobre:

- listagem administrativa de usuários em `/users`;
- visualização de nome, email, papel, status e criação;
- bloqueio e desbloqueio de usuários;
- mudança manual de papel entre `teacher` e `admin`;
- confirmação de ações de risco;
- auditoria administrativa persistida;
- efeito imediato de `blocked` e `role` nas rotas protegidas.

Esta fase não cobre:

- RBAC avançado com múltiplos papéis além de `teacher` e `admin`;
- políticas finas por recurso;
- analytics administrativos amplos;
- workflows de convite, deleção definitiva ou impersonation.

## Recommended Approach

Implementar governança mínima forte sobre `profiles`, adicionando uma tabela própria de auditoria administrativa e usando o módulo de auth/access já estabilizado nas fases anteriores. O desenho mantém a superfície pequena, mas com rastreabilidade suficiente para troubleshooting e responsabilidade operacional.

## Architecture

```text
Admin users page
  -> validated governance route
  -> profiles update
  -> admin_audit_logs insert
  -> immediate effect through existing access-control layer
```

### Module shape

```text
src/features/admin/users/
  contracts.ts
  validation.ts
  service.ts
  components/
    users-table.tsx
    user-governance-dialog.tsx

src/features/admin/audit/
  contracts.ts
  service.ts
```

### Schema extension

Nova tabela `admin_audit_logs` com:

- `id`
- `admin_user_id`
- `target_user_id`
- `action`
- `previous_state`
- `next_state`
- `created_at`

## Data Flow

1. O admin acessa `/users`.
2. A página carrega a lista administrativa normalizada a partir de `profiles`.
3. A UI exibe status atual e role atual sempre visíveis.
4. Ações de risco abrem confirmação explícita:
   - bloquear
   - desbloquear
   - promover para admin
   - rebaixar para teacher
5. `PATCH /api/admin/users/[id]`:
   - valida payload;
   - impede auto-bloqueio;
   - impede auto-rebaixamento se a ação deixar o sistema sem admin;
   - atualiza `profiles`;
   - persiste trilha em `admin_audit_logs`;
   - retorna o usuário atualizado.
6. O controle de acesso já existente consome `profiles.blocked` e `profiles.role`, então o efeito da mudança é imediato na próxima request protegida.

## Error Handling

- não admin: `403`/redirect consistente;
- usuário inexistente: `404`;
- payload inválido: `400` com erro por campo;
- auto-bloqueio: `403`;
- auto-rebaixamento proibido: `403`;
- falha de auditoria: a mutation não deve ser tratada como sucesso;
- mudança administrativa e auditoria devem ser consistentes na mesma operação lógica.

## Testing Strategy

- unit para `AdminUserListItem`, `UserGovernanceAction` e `AuditEntry`;
- unit para validações de bloqueio e troca de papel;
- integration para `PATCH /api/admin/users/[id]` com persistência de auditoria;
- integration para auto-bloqueio e auto-rebaixamento;
- integration para efeito de `blocked` no access control;
- UI tests da tabela e do diálogo de confirmação;
- a11y da página `/users`;
- E2E do fluxo administrativo principal, respeitando os `skips` autenticados já aceitos quando dependentes da dívida de infra.

## Technical Notes

- a mudança de papel precisa ser refletida imediatamente no middleware/SSR já existentes;
- a auditoria deve registrar estado anterior e posterior, não só ação nominal;
- a fase pode exigir migration incremental para `admin_audit_logs`;
- o console de usuários deve seguir o mesmo shell administrativo consolidado na Fase 9.
