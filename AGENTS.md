# AGENTS.md

## Projeto
Plataforma SaaS de constelação online 3D com vídeo integrado.

## Stack Principal
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **3D:** Three.js, React Three Fiber, Drei
- **Backend:** Node.js, Express (realtime), BullMQ (workers)
- **Banco:** PostgreSQL, Prisma ORM, Redis
- **Pagamentos:** Mercado Pago
- **Vídeo:** LiveKit
- **IA:** OpenAI API (via camada abstrata)

## Arquitetura
```
constela-platform/
├── apps/
│   ├── web/              # Next.js (frontend + API)
│   ├── realtime/         # Socket.IO server
│   └── worker/           # BullMQ workers
├── packages/
│   ├── db/               # Prisma schema
│   ├── ui/               # Componentes compartilhados
│   ├── types/            # Tipos globais
│   └── validators/      # Schemas Zod
```

## Regras Gerais

### Antes de Codificar
1. Ler CLOUD.md para contexto atual
2. Verificar estado do projeto
3. Entender dependências da tarefa

### Durante Implementação
1. Nunca alterar arquivos fora do escopo solicitado
2. Sempre validar inputs com Zod
3. Não usar `any` sem justificativa explícita
4. Não expor secrets no código (usar env vars)
5. Implementar tratamento de erros
6. Adicionar logs significativos

### Após Implementação
1. Rodar `pnpm lint` e corrigir warnings
2. Rodar `pnpm typecheck` e corrigir erros
3. Rodar `pnpm test` e garantir que passam
4. Atualizar CLOUD.md com mudanças

## Regras de Negócio (CRÍTICAS)

### IA Assistiva - O que NÃO FAZER
- ❌ Gerar diagnóstico emocional
- ❌ Prometer cura
- ❌ Fazer interpretação clínica
- ❌ Dar orientação médica/psicológica
- ❌ Avaliar trauma
- ❌ Decisão terapêutica automatizada

### IA Assistiva - O que FAZER
- ✅ Resumo administrativo
- ✅ Organização de notas
- ✅ Checklist de preparação
- ✅ Mensagem pós-sessão neutra

### Multi-Tenant
- Toda query deve filtrar por `tenantId`
- Middleware injeta tenantId automaticamente
- Não expor dados entre tenants

### Sessões
- Só entra na sala se status `READY` ou `IN_PROGRESS`
- Só vira `READY` após aceite dos termos
- Sessão paga só vira `READY` após pagamento aprovado

## Perfis de Usuário
1. `PLATFORM_ADMIN` - Admin da plataforma
2. `TENANT_ADMIN` - Admin do constelador
3. `PRACTITIONER` - Constelador
4. `CLIENT` - Cliente
5. `GUEST` - Participante convidado
6. `OBSERVER` - Observador

## MCP Servers Recomendados
Quando trabalhar com documentação externa:
- OpenAI Developer Docs MCP
- GitHub MCP
- Filesystem MCP

## Qualidade de Código
- ESLint + Prettier configurados
- TypeScript strict mode
- Testes unitários com Vitest
- Testes e2e com Playwright

## Scripts Úteis
```bash
# Setup
pnpm install

# Development
pnpm dev                    # Todos os apps
pnpm dev --filter=web      # Só web

# Database
pnpm docker:up             # Iniciar Postgres + Redis
pnpm db:push               # Push schema
pnpm db:migrate            # Migrar
pnpm db:seed               # Seed

# Quality
pnpm lint
pnpm typecheck
pnpm test

# Build
pnpm build
```

## Avisos Importantes
1. **Não começar pela sala 3D** - Parece tentador, mas é cilada. Começar pelo esqueleto (auth, DB, sessions).
2. **V1 primeiro** - Resistir a feature creep. Escopo V1 é pequeno e focado.
3. **Testes** - Toda feature nova deve ter testes.

## Estrutura de Commits
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação (sem mudança de lógica)
refactor: refatoração
test: adiciona/atualiza testes
chore: manutenção
```

---

*Este arquivo orienta agentes de IA trabalhando neste projeto.*
