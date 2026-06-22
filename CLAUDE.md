# CLAUDE.md

## Projeto: Constela Platform

Plataforma SaaS de constelação familiar online 3D com vídeo integrado.

**Repositório:** https://github.com/JunIorUpCode/constela-platform

**Dono:** Edyen (UpCode)

---

## ⚠️ REGRAS DE VERSIONAMENTO (OBRIGATÓRIAS)

### Após cada etapa/conclusão de feature:
1. ✅ Atualizar **CLOUD.md** com o progresso
2. ✅ Fazer **commit** das alterações
3. ✅ Fazer **push** para o GitHub
4. ✅ Criar **tag** se for etapa significativa (ex: `etapa-1`, `etapa-2`)

### Formato de Commits
```
feat: nova funcionalidade
fix: correção de bug  
docs: documentação
style: formatação (sem mudança de lógica)
refactor: refatoração
test: adiciona/atualiza testes
chore: manutenção
perf: otimização
```

### Branch Strategy
- **master/main:** Código de produção
- **feat/xxx:** Novas features
- **fix/xxx:** Correções
- **docs/xxx:** Documentação

---

## Stack Principal

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **3D:** Three.js, React Three Fiber, Drei
- **Backend:** Node.js, Express (realtime), BullMQ (workers)
- **Banco:** PostgreSQL, Prisma ORM, Redis
- **Pagamentos:** Mercado Pago
- **Vídeo:** LiveKit
- **IA:** OpenAI API (via camada abstrata)

## Estrutura do Monorepo

```
apps/
├── web/              # Next.js (frontend + API)
├── realtime/         # Socket.IO server
└── worker/           # BullMQ workers

packages/
├── db/              # Prisma schema
├── ui/              # Componentes compartilhados
├── types/           # Tipos globais
└── validators/      # Schemas Zod
```

---

## Regras de Negócio (CRÍTICAS)

### IA Assistiva - O que NÃO FAZER
- ❌ Gerar diagnóstico emocional
- ❌ Prometer cura
- ❌ Fazer interpretação clínica
- ❌ Dar orientação médica/psicológica
- ❌ Avaliar trauma
- ❌ Decisão terapêutica automatizada

### Multi-Tenant
- Toda query deve filtrar por `tenantId`
- Middleware injeta tenantId automaticamente
- Não expor dados entre tenants

### Sessões
- Só entra na sala se status `READY` ou `IN_PROGRESS`
- Só vira `READY` após aceite dos termos
- Sessão paga só vira `READY` após pagamento aprovado

---

## Perfis de Usuário

1. `PLATFORM_ADMIN` - Admin da plataforma
2. `TENANT_ADMIN` - Admin do constelador
3. `PRACTITIONER` - Constelador
4. `CLIENT` - Cliente
5. `GUEST` - Participante convidado
6. `OBSERVER` - Observador

---

## Scripts Úteis

```bash
# Setup
pnpm install

# Development
pnpm dev                    # Todos os apps
pnpm dev --filter=web      # Só web

# Database
pnpm docker:up             # Iniciar Postgres + Redis
pnpm db:generate           # Gerar Prisma Client
pnpm db:push              # Push schema
pnpm db:migrate            # Migrar
pnpm db:seed              # Seed

# Quality
pnpm lint
pnpm typecheck
pnpm test

# Git (após cada etapa)
git add .
git commit -m "feat: descrição da etapa"
git push
git tag etapa-X
git push origin --tags
```

---

## Conta de Teste (após seed)

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@constela.com | Admin123! |
| Constelador | constelador@exemplo.com | Admin123! |
| Cliente | cliente@exemplo.com | Admin123! |

---

## Avisos Importantes

1. **Não começar pela sala 3D** - Parece tentador, mas é cilada. Começar pelo esqueleto (auth, DB, sessions).
2. **V1 primeiro** - Resistir a feature creep. Escopo V1 é pequeno e focado.
3. **Testes** - Toda feature nova deve ter testes.
4. **Versões** - Sempre commitar e dar push após cada etapa.

---

*Este arquivo é lido pelo Claude Code em cada sessão.*
