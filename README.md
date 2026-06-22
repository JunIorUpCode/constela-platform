# Constela Platform

Plataforma SaaS de constelação familiar online 3D com vídeo integrado.

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker (para Postgres e Redis)

### Setup

```bash
# 1. Instalar dependências
pnpm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 3. Iniciar containers Docker
pnpm docker:up

# 4. Gerar Prisma Client
pnpm db:generate

# 5. Aplicar migrations
pnpm db:push

# 6. Popular banco com dados iniciais
pnpm db:seed

# 7. Iniciar desenvolvimento
pnpm dev
```

### Contas de Teste (após seed)

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@constela.com | Admin123! |
| Constelador | constelador@exemplo.com | Admin123! |
| Cliente | cliente@exemplo.com | Admin123! |

## 📁 Estrutura do Projeto

```
constela-platform/
├── apps/
│   ├── web/              # Next.js (frontend + API)
│   ├── realtime/         # Socket.IO server
│   └── worker/           # BullMQ workers
├── packages/
│   ├── db/               # Prisma schema
│   ├── ui/               # Componentes shadcn/ui
│   ├── types/            # Tipos TypeScript
│   └── validators/       # Schemas Zod
├── infra/
│   └── docker/
├── docker-compose.yml
└── turbo.json
```

## 🎯 Funcionalidades

### V1 (Em desenvolvimento)

- [x] Estrutura monorepo
- [x] Schema Prisma completo
- [x] Autenticação JWT
- [ ] Dashboard admin
- [ ] Dashboard constelador
- [ ] Agenda e agendamento
- [ ] Pagamentos (Mercado Pago)
- [ ] Sala 3D (React Three Fiber)
- [ ] Videochamada (LiveKit)
- [ ] Histórico visual
- [ ] IA assistiva

### V2 (Planejado)

- [ ] Marketplace
- [ ] App mobile
- [ ] Gravação de vídeo

## 🛠️ Stack

| Tecnologia | Uso |
|------------|-----|
| Next.js 14 | Frontend + API |
| TypeScript | Linguagem |
| Tailwind CSS | Estilização |
| Prisma | ORM |
| PostgreSQL | Banco |
| Redis | Cache/Fila |
| Socket.IO | Realtime |
| LiveKit | Vídeo |
| Mercado Pago | Pagamentos |
| OpenAI | IA |

## 📝 Scripts

```bash
# Desenvolvimento
pnpm dev              # Iniciar todos os apps
pnpm dev --filter=web # Só web

# Database
pnpm docker:up        # Iniciar Postgres + Redis
pnpm docker:down      # Parar containers
pnpm db:generate      # Gerar Prisma Client
pnpm db:push          # Push schema
pnpm db:migrate       # Migrar
pnpm db:seed          # Popular dados
pnpm db:studio        # Abrir Prisma Studio

# Quality
pnpm lint             # ESLint
pnpm typecheck        # TypeScript
pnpm test             # Testes

# Build
pnpm build            # Build todos os apps
```

## 📚 Documentação

- [CLOUD.md](./CLOUD.md) - Memória do projeto
- [AGENTS.md](./AGENTS.md) - Guia para agentes de IA

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- RBAC (Role-Based Access Control)
- Multi-tenant isolation
- Validação Zod em todas entradas
- Rate limiting
- Logs de auditoria
- Conformidade LGPD

## 📄 Licença

Proprietary - UpCode
