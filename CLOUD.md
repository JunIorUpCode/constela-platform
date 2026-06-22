# CLOUD.md — Plataforma SaaS de Constelação Online 3D

---

## 1. Identificação do Projeto

- **Nome do projeto:** Constela Platform
- **Tipo de projeto:** SaaS Multi-Tenant (B2B2C)
- **Status atual:** Pré-projeto — Documentação e planejamento
- **Data de início:** 2026-06-26
- **Última atualização:** 2026-06-26
- **Responsável:** Edyen (UpCode)
- **Objetivo principal:** Plataforma SaaS premium para constelação familiar online com sala 3D própria, vídeo integrado, gestão de sessões, agenda, pagamento, histórico visual, permissões granulares e recursos de IA assistiva

---

## 2. Resumo Executivo

Sistema SaaS para constelação familiar online que permite:

- **Consteladores** conduzirem sessões individuais ou em grupo em um campo virtual 3D terapêutico
- **Clientes** agendarem, pagarem e participarem das sessões por vídeo dentro da própria plataforma
- **Observadores** assistirem sem interagir com elementos da sala
- **Convidado(s)** participarem de sessões específicas via token de convite

**Fluxo principal:**
```
Cliente agenda → paga → aceita termos → entra na sala → participa por vídeo
Constelador conduz → move avatares/objetos 3D → salva histórico → encerra sessão
Sistema registra → gera resumo/snapshot → disponibiliza dados conforme permissão
```

**Diferenciais:**
1. Sala 3D terapêutica premium (não "joguinho")
2. Vídeo integrado na mesma tela (sem mudar de aba)
3. Histórico visual da sessão com snapshot e timeline
4. IA assistiva para resumos administrativos (sem diagnóstico)

---

## 3. Objetivo de Negócio

### Problema de negócio
Consteladores dependem de múltiplas ferramentas (Google Meet + plataforma de agendamento + ferramenta de quadro branco) resultando em experiência fragmentada para clientes e perda de dados visuais das sessões.

### Público-alvo
- **CONSTELADORES** (B2B): Profissionais que oferecem constelação familiar como serviço
- **CLIENTES** (B2C): Indivíduos que buscam sessões de constelação
- **PARTICIPANTES CONVIDADOS**: Pessoas chamadas para representar elementos na sessão
- **OBSERVADORES**: Espectadores sem interação

### Resultado esperado
- Plataforma única que unifica agendamento, pagamento, sala 3D e vídeo
- Experiência premium que diferencia o constelador no mercado
- Possibilidade de expansão multi-tenant (múltiplos consteladores na mesma plataforma)

### Benefícios esperados
- Aumento de conversions por fluxo integrado
- Retenção de clientes por histórico visual
- Diferenciação no mercado por tecnologia 3D
- Redução de tarefas administrativas por IA

---

## 4. Escopo Atual

### Inclui (V1 Premium)
- [ ] Autenticação completa (cadastro, login, recuperação de senha)
- [ ] Multi-tenant com isolamento por constelador
- [ ] Perfis: Admin, Constelador, Cliente, Participante Convidado, Observador
- [ ] Agenda com disponibilidade recorrente e bloqueios
- [ ] Agendamento, reagendamento e cancelamento
- [ ] Pagamento via Pix e Cartão (Mercado Pago)
- [ ] Webhook de confirmação de pagamento
- [ ] Liberação automática da sala após pagamento aprovado
- [ ] Termo de consentimento obrigatório (LGPD)
- [ ] Sala 3D com campo, avatares e objetos simbólicos
- [ ] Arrastar, girar, nomear e bloquear elementos
- [ ] Salvar/restaurar estado da cena
- [ ] Snapshot do campo
- [ ] Vídeo integrado (LiveKit) com mute/unmute e camera on/off
- [ ] Lista de participantes e sala de espera
- [ ] Chat na sessão
- [ ] Sessões individuais e em grupo (com observadores)
- [ ] Histórico visual com timeline e eventos da sessão
- [ ] Notas privadas do constelador
- [ ] IA assistiva para resumo administrativo
- [ ] Mensagem pós-sessão gerada por IA
- [ ] Notificações por e-mail
- [ ] Dashboard admin com métricas
- [ ] Logs de auditoria
- [ ] Conformidade LGPD básica

### Não inclui (V2+)
- [ ] Marketplace aberto
- [ ] Repasse financeiro automático
- [ ] Gravação de vídeo
- [ ] Avatares ultra customizados
- [ ] App mobile nativo
- [ ] IA em tempo real na sessão
- [ ] VR/AR
- [ ] Assinaturas recorrentes
- [ ]white-label completo

---

## 5. Stack Utilizada

### Frontend
- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript (strict mode)
- **Estilização:** Tailwind CSS + shadcn/ui
- **Formulários:** React Hook Form + Zod
- **3D:** Three.js + React Three Fiber + Drei
- **Estado:** Zustand ou Jotai
- **Video:** @livekit/components-react

### Backend
- **Runtime:** Node.js (LTS)
- **API:** Next.js API Routes / Server Actions
- **Realtime:** Socket.IO
- **Fila:** BullMQ + Redis
- **Workers:** Processos separados

### Banco de dados
- **Principal:** PostgreSQL
- **ORM:** Prisma
- **Cache:** Redis

### Storage
- **Arquivos:** S3 compatível (Cloudflare R2 ou Backblaze B2)
- **Assets 3D:** GLTF/GLB

### Pagamentos
- **Gateway:** Mercado Pago
- **Métodos:** Pix, Cartão
- **Webhook:** Confirmação server-side

### Video
- **Plataforma:** LiveKit (self-hosted ou cloud)

### IA
- **Provedor:** OpenAI API (via camada abstrata)
- **Uso:** Resumos administrativos, organização de notas

### Deploy
- **Containers:** Docker
- **Orquestração:** Docker Compose
- **Proxy:** Nginx
- **CI/CD:** GitHub Actions
- **VPS:** Inicial

---

## 6. Arquitetura Geral

### Monorepo Structure
```
constela-platform/
├── apps/
│   ├── web/                    # Next.js (frontend + API)
│   ├── realtime/               # Socket.IO server
│   └── worker/                 # BullMQ workers, webhooks
├── packages/
│   ├── db/                     # Prisma schema, migrations, seeds
│   ├── ui/                     # Componentes compartilhados
│   ├── types/                  # Tipos globais TypeScript
│   ├── validators/             # Schemas Zod
│   ├── three-room/             # Engine da sala 3D
│   └── config/                 # ESLint, TSConfig, Prettier
├── infra/
│   ├── docker/
│   └── nginx/
└── docs/
```

### Diagrama de Fluxo
```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   Next.js Web App   │
│  ├── API HTTP       │
│  ├── Server Actions │
│  ├── Sala 3D (R3F)  │
│  ├── Cliente LiveKit│
│  └── Cliente Socket │
└──────┬──────────────┘
       │
       ├──┬────────────┬────────────┐
       │  │            │            │
       ▼  ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ PostgreSQL│  │   Redis   │  │MercadoPago│
│ (Prisma)  │  │  (Cache)  │  │  (API)   │
└──────────┘  └──────────┘  └──────────┘
       │            │
       │            │
       ▼            ▼
┌─────────────────────┐     ┌──────────────┐
│  Realtime Server    │     │  LiveKit      │
│  (Socket.IO)        │     │  (Video/Audio)│
│  - Rooms por sess.  │     └──────────────┘
│  - Eventos 3D      │
│  - Presença         │
└─────────────────────┘
```

### Estados da Sessão
```
DRAFT → SCHEDULED → AWAITING_PAYMENT → PAID → READY
                                                  ↓
                                            IN_PROGRESS
                                                  ↓
                                              COMPLETED
                                                   ↓
CANCELED ←─────────────────── NO_SHOW ←──────────┘
```

### Regras de Transição de Estado
- Só entra na sala se status for `READY` ou `IN_PROGRESS`
- Só vira `READY` se termos foram aceitos
- Se sessão é paga, só vira `READY` após pagamento aprovado (`PAID`)
- Constelador pode entrar antes do cliente
- Convidado precisa de token de convite válido

---

## 7. Estrutura de Pastas

```
projeto 3d/                    # Raiz do projeto (a ser renomeado)
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/                    # Next.js App Router
│       │   │   ├── (auth)/            # Rotas de autenticação
│       │   │   │   ├── login/
│       │   │   │   ├── register/
│       │   │   │   └── forgot-password/
│       │   │   ├── (dashboard)/        # Área logada
│       │   │   │   ├── admin/          # Painel admin
│       │   │   │   ├── practitioner/   # Painel constelador
│       │   │   │   └── client/         # Painel cliente
│       │   │   ├── session/
│       │   │   │   └── [sessionId]/    # Sala de sessão
│       │   │   ├── api/                # API Routes
│       │   │   │   ├── auth/
│       │   │   │   ├── sessions/
│       │   │   │   ├── payments/
│       │   │   │   ├── livekit/
│       │   │   │   └── socket/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── ui/                # shadcn/ui
│       │   │   ├── layout/            # Sidebar, Header, etc
│       │   │   ├── session/           # Componentes da sala
│       │   │   ├── agenda/            # Componentes de agenda
│       │   │   └── video/             # Componentes de vídeo
│       │   ├── lib/
│       │   │   ├── db.ts              # Prisma client
│       │   │   ├── auth.ts            # Auth utilities
│       │   │   ├── payments.ts        # Mercado Pago
│       │   │   ├── livekit.ts         # LiveKit utilities
│       │   │   └── socket.ts          # Socket.IO client
│       │   ├── hooks/                 # Custom hooks
│       │   ├── stores/                # Zustand stores
│       │   └── types/                 # Tipos locais
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seeds/
│       ├── public/
│       ├── tests/
│       └── package.json
├── packages/
│   ├── db/                           # Schema Prisma compartilhado
│   ├── three-room/                   # Engine 3D
│   │   └── src/
│   │       ├── RoomCanvas.tsx
│   │       ├── FieldPlane.tsx
│   │       ├── AvatarEntity.tsx
│   │       ├── ObjectEntity.tsx
│   │       ├── FloatingLabel.tsx
│   │       ├── CameraControls.tsx
│   │       ├── TransformControls.tsx
│   │       ├── SceneStateStore.ts
│   │       └── types.ts
│   ├── types/
│   └── validators/
├── apps/
│   ├── realtime/                     # Socket.IO server
│   └── worker/                       # BullMQ workers
├── infra/
│   ├── docker/
│   └── nginx/
├── .env.example
├── docker-compose.yml
├── package.json (raiz)
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 8. Módulos e Funcionalidades

### Módulo: Autenticação e Autorização
- **Objetivo:** Controlar acesso ao sistema com segurança
- **O que faz:**
  - Cadastro de usuários com email/ senha
  - Login com JWT/sessão
  - Recuperação de senha por email
  - Logout com invalidação de sessão
  - Middleware de proteção de rotas
  - RBAC com 6 perfis
- **Perfis:** `PLATFORM_ADMIN`, `TENANT_ADMIN`, `PRACTITIONER`, `CLIENT`, `GUEST`, `OBSERVER`
- **Status:** Não iniciado
- **Dependências:** Nenhuma
- **Observações:** Não usar `any`, validar com Zod em todas entradas

### Módulo: Multi-Tenant
- **Objetivo:** Isolar dados por constelador
- **O que faz:**
  - Cada tenant tem ID único
  - Queries sempre filtram por tenantId
  - Admin de tenant não vê dados de outros
  - Super admin vê tudo
- **Status:** Não iniciado
- **Dependências:** Autenticação
- **Observações:** Middleware injeta tenantId automaticamente

### Módulo: Agenda e Agendamento
- **Objetivo:** Gerenciar disponibilidade e reservas
- **O que faz:**
  - Cadastro de disponibilidade recorrente (semanal)
  - Bloqueios manuais (férias, etc)
  - Consulta de horários livres
  - Criação de agendamento
  - Reagendamento
  - Cancelamento
  - Lembrete automático
- **Status:** Não iniciado
- **Dependências:** Autenticação, Sessões
- **Regras:**
  - Não permitir dois agendamentos no mesmo horário
  - Não permitir fora da disponibilidade
  - Não liberar sala sem aceite dos termos
  - Não liberar sala paga sem pagamento aprovado

### Módulo: Pagamentos
- **Objetivo:** Processar pagamentos de forma segura
- **O que faz:**
  - Criação de pagamento Pix
  - Criação de pagamento Cartão
  - QR Code e link de pagamento
  - Webhook de confirmação
  - Atualização de status
  - Liberação automática da sessão
- **Status:** Não iniciado
- **Dependências:** Sessões, Mercado Pago
- **Segurança:**
  - Webhook idempotente
  - Validar paymentId externo
  - Não confiar no frontend
  - Registrar payload bruto

### Módulo: Sala 3D
- **Objetivo:** Ambiente visual imersivo para constelação
- **O que faz:**
  - Canvas 3D com Three.js/R3F
  - Campo base visual
  - Câmera com múltiplos modos (TOP, PERSPECTIVE, FRONT, FREE)
  - Avatares 3D (carregamento GLB)
  - Objetos simbólicos
  - Seleção de elementos
  - Arrastar e soltar
  - Girar elementos
  - Nome flutuante
  - Bloquear/desbloquear
  - Salvar estado
  - Restaurar estado
  - Snapshot do campo
- **Status:** Não iniciado
- **Dependências:** Nenhuma
- **Assets:** GLTF/GLB para avatares e objetos

### Módulo: Realtime da Sala
- **Objetivo:** Sincronizar estado 3D entre participantes
- **O que faz:**
  - Socket.IO server com rooms por sessionId
  - Autenticação por token
  - Eventos: `room:join`, `room:leave`, `avatar:add`, `avatar:move`, `avatar:rotate`, `avatar:lock`, `avatar:unlock`, `object:add`, `object:move`, `object:delete`, `scene:save`, `scene:snapshot`, `permission:update`
  - Validação de permissão por evento
  - Broadcast para participantes
  - Throttling: máx 15-30 events/s durante drag
- **Status:** Não iniciado
- **Dependências:** Sala 3D, Autenticação
- **Observações:** Rejeitar se avatar está bloqueado

### Módulo: Videochamada
- **Objetivo:** Vídeo integrado na sala
- **O que faz:**
  - Criação de sala LiveKit por sessão
  - Geração de token por participante
  - Componente VideoPanel
  - Mute/unmute áudio
  - Camera on/off
  - Lista de participantes
  - Controle de host (moderar entrada)
  - Sala de espera (se viável)
- **Status:** Não iniciado
- **Dependências:** Autenticação, Sessões
- **Segurança:** Validar se usuário é participante autorizado

### Módulo: Histórico Visual
- **Objetivo:** Registrar e visualizar sessões passadas
- **O que faz:**
  - Persistir SceneEvent (eventType, payload, createdBy, timestamp)
  - Timeline visual no painel do constelador
  - Salvar estado inicial
  - Salvar principais movimentos
  - Salvar estado final
  - Gerar snapshot
  - Notas privadas do constelador
  - Não gravar vídeo por padrão
- **Status:** Não iniciado
- **Dependências:** Realtime, Sessões

### Módulo: IA Assistiva
- **Objetivo:** Acelerar tarefas administrativas
- **O que faz:**
  - Resumo administrativo da sessão
  - Organização de notas
  - Mensagem pós-sessão neutra
  - Checklist de preparação
  - FAQ da plataforma
  - Suporte técnico básico
- **O que NÃO FAZ:**
  - Diagnóstico emocional
  - Promessa de cura
  - Interpretação clínica
  - Orientação médica/psicológica
  - Avaliação de trauma
  - Decisão terapêutica automatizada
- **Status:** Não iniciado
- **Dependências:** Histórico Visual
- **Segurança:** Prompts com bloqueios explícitos

### Módulo: LGPD e Consentimento
- **Objetivo:** Conformidade legal e proteção de dados
- **O que faz:**
  - Termo de consentimento versionado
  - Aceite com IP, data, userAgent
  - Política de privacidade
  - Logs de auditoria
  - Controle de retenção
  - Exportação de dados do usuário
  - Exclusão/anonimização
- **Status:** Não iniciado
- **Dependências:** Autenticação
- **Dados sensíveis:** Tratar com cuidado extra

### Módulo: Notificações
- **Objetivo:** Comunicação automática com usuários
- **O que faz:**
  - Email de confirmação
  - Lembrete antes da sessão
  - Link da sala
  - Confirmação de pagamento
  - Cancelamento
  - Mensagem pós-sessão
- **Stack:** BullMQ + Redis + Email (future: WhatsApp)
- **Status:** Não iniciado
- **Dependências:** Sessões, Autenticação

### Módulo: Dashboard Admin
- **Objetivo:** Visão operacional da plataforma
- **O que faz:**
  - Métricas principais
  - Listagem de usuários
  - Gestão de consteladores
  - Gestão de sessões
  - Gestão de pagamentos
  - Logs de auditoria
  - Configurações globais
- **Status:** Não iniciado
- **Dependências:** Todos os módulos

---

## 9. Regras de Negócio

1. **Multi-tenant isolation:** Toda query sensível deve filtrar por `tenantId`
2. **RBAC granular:** Cada perfil tem permissões específicas (não mostrar o que não pode acessar)
3. ** Sessão só entra se:**
   - Status `READY` ou `IN_PROGRESS`
   - Termos aceitos
   - Se paga: pagamento aprovado
4. **Pagamento idempotente:** Não criar duplicatas, validar webhook
5. **Disponibilidade:**
   - Não permitir dois agendamentos no mesmo horário
   - Não permitir fora da disponibilidade configurada
6. **Avatar bloqueado:** Não aceitar eventos de movimento de terceiros
7. **Throttling realtime:** Máximo 15-30 eventos/segundo durante drag
8. **IA sem clínica:** Nunca gerar diagnóstico, promessa de cura ou orientação clínica
9. **LGPD:**
   - Termo obrigatório antes de acessar sala
   - Log de aceite com IP/data
   - Exportação de dados sob demanda
   - Exclusão de dados
10. **Histórico:** Salvar estado inicial, eventos principais e estado final
11. **Convidado:** Acesso via token de convite, só para sessão específica

---

## 10. Fluxos do Usuário

### Fluxo: Cadastro e Login
```
1. Usuário acessa /register
2. Preenche: nome, email, senha, tipo (constelador/cliente)
3. Sistema valida Zod
4. Sistema cria User + perfil correspondente
5. Sistema envia email de verificação (futuro)
6. Usuário acessa /login
7. Preenche email e senha
8. Sistema valida credenciais
9. Sistema cria sessão JWT
10. Redireciona conforme perfil:
    - PLATFORM_ADMIN → /admin
    - PRACTITIONER → /practitioner
    - CLIENT → /client
```

### Fluxo: Agendamento de Sessão
```
1. Cliente acessa /practitioner/[id]
2. Vê perfil e disponibilidade
3. Clica em horário disponível
4. Sistema valida horário livre
5. Se pago: exibe checkout Mercado Pago
6. Cliente paga (Pix ou Cartão)
7. Mercado Pago envia webhook
8. Sistema atualiza Payment → APPROVED
9. Sistema atualiza Session → PAID → READY
10. Sistema envia email de confirmação com link
```

### Fluxo: Participação na Sessão
```
1. Cliente acessa link da sessão
2. Sistema verifica status = READY ou IN_PROGRESS
3. Sistema verifica aceite dos termos
4. Sistema verifica pagamento (se aplicável)
5. Cliente aceita termo (se necessário)
6. Sistema gera token LiveKit
7. Cliente entra na sala
8. Vídeo conecta, avatares carregam
9. Constelador conduz a sessão
10. Sistema registra eventos
11. Ao final: constelador encerra
12. Sistema salva estado final
13. IA gera resumo (se configurado)
14. Cliente recebe mensagem pós-sessão
```

### Fluxo: Convidado para Sessão
```
1. Constelador envia link de convite para participante
2. Participante acessa link (não precisa ter conta)
3. Sistema cria User temporário (tipo GUEST)
4. Participante aceita termos
5. Entra na sala com permissões limitadas
6. Não vê histórico completo
7. Só manipula avatares se permitido pelo constelador
```

---

## 11. Páginas e Telas

### Página: Landing Page
- Objetivo: Converter visitantes em clientes
- Conteúdo: Hero, funcionalidades, depoimentos, CTA
- Estados: Logado (redireciona) / Deslogado

### Página: Login (/login)
- Objetivo: Autenticar usuário
- Campos: Email, senha
- Validações: Email válido, senha não vazia
- Ações: Login, Esqueci minha senha, Criar conta
- Erros: Credenciais inválidas, conta não verificada

### Página: Registro (/register)
- Objetivo: Criar nova conta
- Campos: Nome, email, senha, confirmação senha, tipo conta
- Validações: Email único, senha forte, senhas coincidem
- Ações: Registrar, Já tenho conta

### Página: Dashboard Constelador (/practitioner)
- Objetivo: Visão geral da atividade
- Blocos: Próximas sessões, Clientes recentes, Receita do mês, Ações rápidas
- Links: Agenda, Clientes, Histórico, Configurações

### Página: Agenda (/practitioner/agenda)
- Objetivo: Gerenciar disponibilidade
- Componentes: Calendário mensal, regras de disponibilidade, bloqueios
- Ações: Adicionar disponibilidade, Bloquear horário, Ver agendamentos

### Página: Minhas Sessões (/practitioner/sessions)
- Objetivo: Listar sessões
- Tabela: Data, cliente, tipo, status, ações
- Filtros: Status, período, tipo
- Ações: Ver detalhes, Iniciar sessão, Cancelar

### Página: Sala de Sessão (/session/[sessionId])
- Objetivo: Ambiente de constelação
- Layout Desktop:
  - Campo 3D à esquerda (70%)
  - Painel de vídeo/chat à direita (30%)
- Layout Mobile: Tabs (Campo, Vídeo, Chat, Participantes)
- Componentes: Canvas 3D, VideoPanel, Chat, Lista participantes, Toolbar, Timeline

### Página: Checkout (/session/[sessionId]/checkout)
- Objetivo: Pagamento da sessão
- Componentes: Resumo da sessão, QR Code Pix, Formulário cartão, Status pagamento
- Ações: Voltar, Pagar

### Página: Aceite de Termos (/session/[sessionId]/consent)
- Objetivo: Obter consentimento LGPD
- Componente: Texto do termo, checkbox aceite, botão confirmar
- Após aceite: Redireciona para sala

### Página: Dashboard Cliente (/client)
- Objetivo: Visão geral para cliente
- Blocos: Próximas sessões, Histórico, Pagamentos pendentes

### Página: Dashboard Admin (/admin)
- Objetivo: Gerenciar plataforma
- Blocos: Métricas globais, Usuários recentes, Sessões pendentes
- Links: Usuários, Sessões, Pagamentos, Configurações, Logs

---

## 12. Componentes Principais

### Componente: Sidebar
- Função: Navegação principal
- Onde aparece: Dashboard constelador, admin
- Comportamento: Collapse em mobile
- Estados: Expandido, colapsado

### Componente: SessionCard
- Função: Exibir resumo de sessão
- Props: session, actions
- Estados: agendada, em andamento, completa, cancelada

### Componente: AvatarEntity (3D)
- Função: Representar pessoa no campo
- Props: position, rotation, label, locked, assetUrl
- Interação: Click para selecionar, drag para mover, ctrl+drag para girar
- Estados: normal, selecionado, bloqueado, hover

### Componente: ObjectEntity (3D)
- Função: Objeto simbólico no campo
- Props: position, rotation, label, locked, assetUrl, objectType
- Interação: Similar a AvatarEntity
- Estados: normal, selecionado, bloqueado, hover

### Componente: VideoPanel
- Função: Container de vídeo LiveKit
- Props: sessionId, userId
- Componentes internos: ParticipantTile, Controls, ParticipantList
- Estados: conectando, conectado, erro

### Componente: TransformControls (3D)
- Função: Controles de transformação
- Modos: translate, rotate, scale
- Bind: Componente selecionado
- Estados: ativo, inativo, drag

### Componente: SceneTimeline
- Função: Timeline de eventos da sessão
- Props: events
- Comportamento: Scroll horizontal, click para restaurar
- Estados: carregando, vazio, com eventos

### Componente: SnapshotButton
- Função: Gerar imagem do campo
- Ação: Captura canvas 3D, salva no storage
- Estados: idle, capturando, sucesso, erro

### Componente: ConsentForm
- Função: Termo de consentimento
- Props: termText, onAccept
- Validação: Checkbox obrigatório
- Logs: IP, timestamp, userAgent

### Componente: PaymentQRCode
- Função: Exibir QR Code Pix
- Props: paymentData
- Comportamento: Polling de status
- Estados: esperando, aprovado, rejeitado, expirado

---

## 13. Modelos de Dados / Entidades

### Tenant
```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
  sessions  Session[]
  // ...
}
```

### User
```prisma
model User {
  id           String    @id @default(cuid())
  tenantId     String?
  email        String    @unique
  name         String
  passwordHash String?
  role         UserRole
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  tenant           Tenant?            @relation(fields: [tenantId], references: [id])
  practitionerProfile PractitionerProfile?
  clientProfile    ClientProfile?
  // ...
}

enum UserRole {
  PLATFORM_ADMIN
  TENANT_ADMIN
  PRACTITIONER
  CLIENT
  GUEST
  OBSERVER
}
```

### PractitionerProfile
```prisma
model PractitionerProfile {
  id           String   @id @default(cuid())
  userId       String   @unique
  bio          String?
  sessionPrice Int?     // Centavos
  sessionDuration Int?  // Minutos
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id])
  availability AvailabilityRule[]
  sessions     Session[]
}
```

### ClientProfile
```prisma
model ClientProfile {
  id           String   @id @default(cuid())
  userId       String   @unique
  phone        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id])
  appointments Appointment[]
  sessionParticipants SessionParticipant[]
}
```

### Session
```prisma
model Session {
  id             String        @id @default(cuid())
  tenantId       String
  practitionerId String
  title          String
  type           SessionType
  status         SessionStatus
  startsAt       DateTime
  endsAt         DateTime
  priceCents     Int?
  notes          String?       // Notas privadas
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  tenant         Tenant        @relation(fields: [tenantId], references: [id])
  practitioner   PractitionerProfile @relation(fields: [practitionerId], references: [id])
  participants   SessionParticipant[]
  sceneEvents    SceneEvent[]
  sceneSnapshots SceneSnapshot[]
  payment        Payment?
  consentAcceptances ConsentAcceptance[]
}

enum SessionType {
  INDIVIDUAL
  GROUP_CLOSED
  GROUP_WITH_OBSERVERS
  DEMONSTRATION
}

enum SessionStatus {
  DRAFT
  SCHEDULED
  AWAITING_PAYMENT
  PAID
  READY
  IN_PROGRESS
  COMPLETED
  CANCELED
  NO_SHOW
}
```

### SessionParticipant
```prisma
model SessionParticipant {
  id           String           @id @default(cuid())
  sessionId    String
  userId       String
  role         ParticipantRole
  canMoveElements Boolean        @default(false)
  joinedAt     DateTime?
  leftAt       DateTime?
  createdAt    DateTime         @default(now())

  session      Session          @relation(fields: [sessionId], references: [id])
  user         ClientProfile    @relation(fields: [userId], references: [id])
}

enum ParticipantRole {
  CLIENT
  REPRESENTATIVE
  OBSERVER
  GUEST
}
```

### SceneEvent
```prisma
model SceneEvent {
  id         String      @id @default(cuid())
  sessionId  String
  eventType  String      // avatar:add, avatar:move, object:add, etc
  payload    Json        // Dados do evento
  version    Int
  createdBy  String
  createdAt  DateTime    @default(now())

  session    Session     @relation(fields: [sessionId], references: [id])
}
```

### Payment
```prisma
model Payment {
  id               String        @id @default(cuid())
  sessionId        String        @unique
  amountCents      Int
  method           PaymentMethod
  status           PaymentStatus
  externalId       String?       // ID no Mercado Pago
  qrCode           String?       // QR Code Pix
  qrCodeUrl        String?       // URL do QR Code
  paidAt           DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  session          Session       @relation(fields: [sessionId], references: [id])
}

enum PaymentMethod {
  PIX
  CARD
}

enum PaymentStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELED
  REFUNDED
  EXPIRED
}
```

### ConsentTerm
```prisma
model ConsentTerm {
  id        String   @id @default(cuid())
  version   String
  title     String
  content   String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  acceptances ConsentAcceptance[]
}

model ConsentAcceptance {
  id           String   @id @default(cuid())
  consentTermId String
  userId       String
  sessionId    String?
  ipAddress    String
  userAgent    String
  acceptedAt   DateTime @default(now())

  consentTerm  ConsentTerm @relation(fields: [consentTermId], references: [id])
}
```

### AuditLog
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  tenantId   String?
  userId     String?
  action     String
  entityType String?
  entityId   String?
  payload    Json?
  ipAddress  String?
  createdAt  DateTime @default(now())
}
```

---

## 14. APIs e Integrações

### API: Autenticação

#### POST /api/auth/register
- Objetivo: Criar conta
- Autenticação: Nenhuma
- Payload: `{ name, email, password, accountType }`
- Resposta: `{ user, token }`
- Validação: Zod

#### POST /api/auth/login
- Objetivo: Login
- Autenticação: Nenhuma
- Payload: `{ email, password }`
- Resposta: `{ user, token }`

#### POST /api/auth/logout
- Objetivo: Logout
- Autenticação: Bearer token
- Resposta: `{ success: true }`

#### POST /api/auth/forgot-password
- Objetivo: Solicitar recuperação
- Payload: `{ email }`
- Resposta: `{ message }`

### API: Sessões

#### GET /api/sessions
- Objetivo: Listar sessões (filtrado por perfil)
- Autenticação: Bearer token
- Query: `{ status?, practitionerId?, from?, to? }`
- Resposta: `{ sessions: Session[] }`

#### POST /api/sessions
- Objetivo: Criar sessão
- Autenticação: PRACTITIONER
- Payload: `{ title, type, startsAt, endsAt, priceCents?, participantIds? }`

#### GET /api/sessions/[id]
- Objetivo: Detalhes da sessão
- Autenticação: PARTICIPANT
- Resposta: `{ session, participants, sceneState? }`

#### PATCH /api/sessions/[id]
- Objetivo: Atualizar sessão
- Autenticação: PRACTITIONER (owner)

#### POST /api/sessions/[id]/start
- Objetivo: Iniciar sessão
- Autenticação: PRACTITIONER
- Ação: Status → IN_PROGRESS

#### POST /api/sessions/[id]/end
- Objetivo: Encerrar sessão
- Autenticação: PRACTITIONER
- Ação: Status → COMPLETED, salvar estado final

### API: Pagamentos

#### POST /api/payments/create
- Objetivo: Criar pagamento
- Autenticação: CLIENT (participant)
- Payload: `{ sessionId, method }`
- Resposta: `{ paymentId, qrCode?, checkoutUrl? }`
- Ação: Chama Mercado Pago, salva Payment PENDING

#### POST /api/payments/webhook
- Objetivo: Webhook do Mercado Pago
- Autenticação: Webhook signature
- Payload: Mercado Pago payload
- Ação: Atualizar Payment status, atualizar Session status

### API: LiveKit

#### POST /api/livekit/token
- Objetivo: Gerar token de acesso
- Autenticação: Bearer token + participant validation
- Payload: `{ sessionId }`
- Resposta: `{ token, roomName }`
- Validação: Verificar se é participante autorizado

### API: Realtime (Socket.IO)

#### Eventos Client → Server
- `room:join` → Unir à sala da sessão
- `avatar:add` → Adicionar avatar
- `avatar:move` → Mover avatar
- `avatar:rotate` → Girar avatar
- `avatar:lock` → Bloquear avatar
- `object:add` → Adicionar objeto
- `object:move` → Mover objeto
- `object:delete` → Remover objeto
- `scene:save` → Salvar estado

#### Eventos Server → Client
- `room:joined` → Confirmação de entrada
- `room:user-joined` → Outro entrou
- `room:user-left` → Outro saiu
- `avatar:added` → Avatar adicionado
- `avatar:moved` → Avatar movido
- `avatar:locked` → Avatar bloqueado
- `object:added` → Objeto adicionado
- `object:moved` → Objeto movido
- `object:deleted` → Objeto removido
- `scene:saved` → Estado salvo

### Integração: Mercado Pago
- **Finalidade:** Pagamentos Pix e Cartão
- **Ambiente:** Sandbox (desenvolvimento), Production (produção)
- **Autenticação:** Access Token (ambiente, secret)
- **Webhook:** Configurar URL de callback
- **Dados trafegados:** Payment ID, status, valor
- **Segurança:** Validar assinatura do webhook

### Integração: LiveKit
- **Finalidade:** Videochamada
- **Opções:** Self-hosted ou Cloud
- **Autenticação:** API Key + Secret
- **Token:** Gerado por sessão + participant
- **Rooms:** Criadas dinamicamente por sessão

### Integração: OpenAI
- **Finalidade:** IA assistiva
- **Modelo:** GPT-4 (via camada abstrata)
- **Uso:** Resumos, organização de notas
- **Segurança:** Prompts com bloqueios

---

## 15. Autenticação e Autorização

### Método de Autenticação
- **Primário:** JWT (access token)
- **Armazenamento:** HTTP-only cookie
- **Validade:** 7 dias (refresh token)
- **Refresh:** Automático via middleware

### Estratégia de Sessão
- Server-side sessions via Prisma + Redis
- Sessions invalidated on logout
- Rate limiting por IP

### Perfis e Permissões

| Ação                              | ADMIN | PRACTITIONER | CLIENT | GUEST | OBSERVER |
|-----------------------------------|-------|--------------|--------|-------|----------|
| Ver todos os tenants              | ✓     | ✗            | ✗      | ✗     | ✗        |
| Gerenciar usuários                | ✓     | ✗            | ✗      | ✗     | ✗        |
| Ver métricas globais             | ✓     | ✗            | ✗      | ✗     | ✗        |
| Criar sessão                     | ✓     | ✓            | ✗      | ✗     | ✗        |
| Ver sessões propias              | ✓     | ✓            | ✓      | ✗     | ✗        |
| Entrar em sessão                 | ✓     | ✓            | ✓      | ✓     | ✓        |
| Mover elementos da sala          | ✗     | ✓ (own)      | ✗      | ✗     | ✗        |
| Mover se permitido               | ✗     | ✓            | ✓      | ✓     | ✗        |
| Bloquear elementos               | ✗     | ✓            | ✗      | ✗     | ✗        |
| Ver notas privadas               | ✗     | ✓            | ✗      | ✗     | ✗        |
| Ver histórico visual             | ✗     | ✓            | ✗      | ✗     | ✗        |
| Agendar sessão                   | ✗     | ✗            | ✓      | ✗     | ✗        |
| Pagar sessão                     | ✗     | ✗            | ✓      | ✗     | ✗        |
| Aceitar termos                   | ✗     | ✗            | ✓      | ✓     | ✗        |
| Gerar resumo IA                  | ✗     | ✓            | ✗      | ✗     | ✗        |

### Proteção de Rotas
```typescript
// Middleware pseudo-código
async function middleware(req) {
  const session = await getSession(req);
  if (!session) return redirect('/login');
  
  const route = req.nextUrl.pathname;
  const requiredRole = getRequiredRole(route);
  
  if (!hasRole(session.user, requiredRole)) {
    return redirect('/unauthorized');
  }
  
  if (requiresTenantAccess(route)) {
    req.tenantId = session.user.tenantId;
  }
}
```

### Regras de Segurança
1. Todos os inputs validados com Zod
2. CSRF tokens em mutações
3. CORS configurado para origens conhecidas
4. Rate limiting em endpoints sensíveis
5. Sanitização de texto em inputs
6. Não expor IDs internos sequential
7. Logs de auditoria em ações críticas

---

## 16. Estado Atual de Implementação

### ✅ Já Concluído
- [x] Documento de requisitos (SRS)
- [x] Arquitetura macro definida
- [x] Stack tecnológica definida
- [x] Modelo de dados inicial definido
- [x] AGENTS.md estruturado
- [x] Estrutura monorepo criada (pnpm workspaces)
- [x] TypeScript strict mode configurado
- [x] ESLint + Prettier configurados
- [x] Turborepo configurado
- [x] Docker Compose local (Postgres + Redis)
- [x] .env.example criado
- [x] Prisma schema completo com 15+ entidades
- [x] Seed com admin inicial e contas de teste
- [x] Sistema de autenticação JWT completo
- [x] Middleware Next.js para proteção de rotas
- [x] RBAC com 6 perfis implementados
- [x] Páginas de login, registro, forgot-password
- [x] Dashboards para Admin, Constelador e Cliente
- [x] API de Sessions (CRUD, start, end)
- [x] API de Availability (regras de disponibilidade)
- [x] API de Availability Blocks (bloqueios)
- [x] API de Participants (participantes de sessão)
- [x] API de Practitioners (listagem e perfil público)
- [x] API de Practitioners Clients (clientes do constelador)
- [x] Integração Mercado Pago (Pix, Cartão, Webhook)
- [x] PaymentProvider com interface abstrata
- [x] Package @constela/three-room com React Three Fiber
- [x] RoomCanvas, SceneEntity, FieldBase, GridHelper
- [x] Zustand store para gerenciamento de estado da cena
- [x] CameraController com múltiplos modos (TOP, FRONT, PERSPECTIVE)
- [x] Servidor Socket.IO com RoomManager
- [x] Eventos realtime: avatar add/move/rotate, object add/move/delete
- [x] Controle de permissões e snapshots de cena
- [x] LiveKit token generation e API de tokens
- [x] VideoPanel com grid de participantes
- [x] Permissões por role (host/guest/observer)

### 🔄 Em Andamento
- [ ] Etapa 8: Histórico visual e snapshots

### 📋 Ainda Não Iniciado
- [ ] Etapa 11: Histórico visual
- [ ] Etapa 12: IA assistiva
- [ ] Etapa 13: Notificações
- [ ] Etapa 14: Segurança, LGPD e auditoria
- [ ] Etapa 15: Testes e QA
- [ ] Etapa 16: Deploy e produção

### 🔒 Bloqueado
- Nenhum

---

## 17. Checklist Macro

- [x] Definição completa do escopo ✓
- [x] Arquitetura definida ✓
- [x] Modelagem de dados definida ✓
- [x] Fundação técnica (monorepo, lint, docker) ✓
- [ ] Autenticação implementada
- [ ] Layout base implementado
- [ ] Fluxos principais implementados
- [ ] Regras de negócio implementadas
- [ ] Integrações implementadas
- [ ] Testes principais realizados
- [ ] Preparação para produção

---

## 18. Checklist Técnico

- [x] Estrutura de monorepo criada
- [x] pnpm workspaces configurado
- [x] Variáveis de ambiente mapeadas (.env.example)
- [ ] PostgreSQL configurado (via Docker)
- [ ] Redis configurado (via Docker)
- [ ] Migrações Prisma criadas
- [x] Seed com admin inicial criada
- [ ] Rotas principais de API criadas
- [ ] Middleware de autenticação
- [ ] Middleware de autorização (RBAC)
- [ ] Middleware de tenant isolation
- [ ] Validação de entrada (Zod)
- [ ] Tratamento de erros global
- [ ] Logs de auditoria
- [ ] Rate limiting
- [ ] Monitoramento (telemetry)
- [ ] Build de produção validado
- [ ] Dockerfiles criados
- [ ] docker-compose criado

---

## 19. Pendências

### Técnicas
1. Decidir: Repositório git inicializado? (atualmente "não é git repository")
2. Decidir: Nome definitivo do projeto (atualmente "projeto 3d")
3. Configurar ambiente de desenvolvimento local
4. Criar conta GitHub para versionamento
5. Configurar Codex CLI se necessário

### Negócio
1. Contrato de propriedade intelectual definido?
2. Modelo de licenciamento definido? (implantação única vs SaaS)
3. Escopo V1 finalizado ou ainda aberto?

### Próximas Ações Imediatas
1. Criar estrutura de monorepo
2. Configurar Prisma schema completo
3. Implementar autenticação
4. Implementar Sala 3D offline (teste)

---

## 20. Bugs Conhecidos

Nenhum (projeto novo)

---

## 21. Decisões Técnicas Já Tomadas

### Decisão 1: Arquitetura Monorepo
- **Contexto:** Projeto SaaS multi-tenant com múltiplos apps
- **Decisão:** Monorepo com pnpm workspaces + Turborepo
- **Motivo:** Compartilhamento de código entre apps,版本 consistente
- **Impacto:** apps/web, apps/realtime, apps/worker, packages/*

### Decisão 2: Next.js App Router
- **Contexto:** Frontend com Server Components
- **Decisão:** Next.js com App Router
- **Motivo:** Server Actions, streaming, melhor DX
- **Impacto:** Estrutura de pastas em app/*

### Decisão 3: React Three Fiber para 3D
- **Contexto:** Sala 3D imersiva
- **Decisão:** Three.js + React Three Fiber + Drei
- **Motivo:** Paradigma declarativo, componentes reutilizáveis
- **Impacto:** packages/three-room

### Decisão 4: LiveKit para Vídeo
- **Contexto:** Vídeo integrado na sala
- **Decisão:** LiveKit (não Google Meet)
- **Motivo:** Integração customizável, controle total
- **Impacto:** Componentes de vídeo, token generation

### Decisão 5: Mercado Pago para Pagamentos
- **Contexto:** Gateway para Brasil
- **Decisão:** Mercado Pago (Checkout Transparente)
- **Motivo:** Pix nativo, popular no Brasil, API robusta
- **Impacto:** Camada de pagamento, webhooks

### Decisão 6: Socket.IO para Realtime
- **Contexto:** Sincronização da sala 3D
- **Decisão:** Socket.IO (apps/realtime dedicado)
- **Motivo:** Rooms, eventos, autenticação, fallbacks
- **Impacto:** Server realtime separado

### Decisão 7: Multi-tenant por tenantId
- **Contexto:** Isolamento de dados entre consteladores
- **Decisão:** Toda tabela com tenantId, queries sempre filtram
- **Motivo:** Simplicidade, compatibilidade com Prisma
- **Impacto:** Schema, queries, middleware

### Decisão 8: IA via Camada Abstrata
- **Contexto:** IA assistiva
- **Decisão:** AiProvider abstrato + implementação OpenAI
- **Motivo:** Trocar provedor sem mudar código
- **Impacto:** packages/ai ou similar

### Decisão 9: Propriedade Intelectual
- **Contexto:** Primeira cliente
- **Decisão (recomendada):** UpCode mantém plataforma-base; cliente compra licença/implantação
- **Motivo:** Cria ativo reaproveitável
- **Impacto:** Contrato, licenciamento

---

## 22. Riscos e Limitações

### Riscos Técnicos
1. **Complexidade 3D:** Three.js/react-three-fiber tem curva de aprendizado
   - Mitigação: packages/three-room isolado e testável
2. **Latência realtime:** Movimentação de avatares em tempo real
   - Mitigação: Throttling, otimização de payloads
3. **Video em escala:** LiveKit pode ter custo crescente
   - Mitigação: Começar com poucos participantes, otimizar
4. **LGPD:** Dados sensíveis de clientes
   - Mitigação: Termos, criptografia, logs, retrição de acesso

### Riscos de Projeto
1. **Escopo creep:** many nice-to-haves no backlog
   - Mitigação: V1 focada, backlog para V2
2. **Dependência de única cliente:** Todas decisões para um caso
   - Mitigação: Manter arquitetura genérica, não hardcodar
3. **Tempo de entrega:** Projeto grande com fases
   - Mitigação: Entregas incrementais, validar com cliente

### Limitações Conhecidas
1. **Sem app mobile:** V1 web only
2. **Sem gravação de vídeo:** Apenas sessão ao vivo
3. **Sem marketplace:** Múltiplos consteladores mas gestão central
4. **Sem white-label completo:** Customização limitada

---

## 23. Histórico de Mudanças

### 2026-06-26 - Criação inicial do projeto
- **Descrição:** Documento mestre SRS criado, arquitetura e stack definidas
- **Impacto:** Base para todo desenvolvimento
- **Arquivos/módulos afetados:** CLOUD.md, AGENTS.md (futuro)

### 2026-06-26 - Etapa 1 concluída: Fundação técnica
- **Descrição:** Criada estrutura monorepo completa com pnpm workspaces, Next.js, Prisma, Docker Compose, ESLint, Prettier, Turborepo
- **Impacto:** Base sólida para desenvolvimento
- **Arquivos/módulos afetados:**
  - package.json raiz
  - pnpm-workspace.yaml
  - turbo.json
  - apps/web/* (Next.js configurado)
  - apps/realtime/* (Socket.IO base)
  - apps/worker/* (BullMQ base)
  - packages/db/* (Prisma schema + seed)
  - packages/types/* (tipos TypeScript)
  - packages/validators/* (schemas Zod)
  - packages/ui/* (componentes shadcn)
  - docker-compose.yml
  - .env.example
  - .gitignore
  - .eslintrc.js
  - .prettierrc
  - README.md

---

## 24. Próximos Passos

### Imediato (Etapa 1)
1. [ ] Renomear pasta do projeto para nome definitivo
2. [ ] Inicializar git repository
3. [ ] Criar estrutura monorepo com pnpm
4. [ ] Configurar TypeScript strict
5. [ ] Configurar ESLint + Prettier
6. [ ] Criar Docker Compose local (Postgres + Redis)
7. [ ] Criar AGENTS.md

### Etapa 2
8. [ ] Implementar Prisma schema completo
9. [ ] Criar migrations
10. [ ] Criar seed com admin inicial
11. [ ] Criar schemas Zod de validação

### Etapa 3
12. [ ] Implementar autenticação (registro, login, sessão)
13. [ ] Implementar middleware de autenticação
14. [ ] Implementar RBAC
15. [ ] Implementar tenant isolation middleware
16. [ ] Criar testes de autenticação

### Etapa 4
17. [ ] Setup Dashboard Admin básico
18. [ ] Listagem de usuários
19. [ ] CRUD de consteladores

### Etapa 5
20. [ ] Setup Dashboard Constelador
21. [ ] Perfil público do constelador
22. [ ] Listagem de clientes
23. [ ] Listagem de sessões

### Etapa 6
24. [ ] Service de disponibilidade
25. [ ] CRUD de regras de disponibilidade
26. [ ] Service de agendamento
27. [ ] Regras de conflito

### Etapa 7
28. [ ] Camada PaymentProvider abstrata
29. [ ] Implementação MercadoPagoProvider
30. [ ] Endpoint de criação de pagamento
31. [ ] Endpoint de webhook
32. [ ] Liberação automática de sessão

### Etapa 8
33. [ ] packages/three-room
34. [ ] RoomCanvas + campo base
35. [ ] AvatarEntity
36. [ ] ObjectEntity
37. [ ] TransformControls
38. [ ] SceneStateStore

### Etapa 9
39. [ ] apps/realtime com Socket.IO
40. [ ] Eventos de sala
41. [ ] Validação de permissões
42. [ ] Broadcast de eventos

### Etapa 10
43. [ ] LiveKit token endpoint
44. [ ] VideoPanel component
45. [ ] Lista de participantes

### Etapa 11
46. [ ] Persistência de SceneEvent
47. [ ] Timeline visual
48. [ ] Snapshot button

### Etapa 12
49. [ ] Camada AiProvider
50. [ ] SessionSummaryService
51. [ ] Mensagem pós-sessão

### Etapa 13
52. [ ] NotificationService
53. [ ] BullMQ setup
54. [ ] Templates de email

### Etapa 14
55. [ ] ConsentTerm + ConsentAcceptance
56. [ ] AuditLog middleware
57. [ ] Exportação de dados

### Etapa 15
58. [ ] Testes unitários
59. [ ] Testes de integração
60. [ ] Testes e2e

### Etapa 16
61. [ ] Dockerfiles
62. [ ] docker-compose.prod
63. [ ] CI/CD
64. [ ] Staging environment

---

## 25. Instruções Operacionais para o Agente

### Antes de qualquer alteração:
1. ✅ Ler este arquivo CLOUD.md por completo
2. ✅ Identificar o estado atual do projeto
3. ✅ Verificar pendências, riscos e decisões já tomadas
4. ✅ Consultar AGENTS.md se existir
5. ✅ Planejar antes de implementar (usar skill de brainstorming se necessário)

### Depois de qualquer alteração relevante:
1. ✅ Atualizar este arquivo CLOUD.md
2. ✅ Registrar o que mudou
3. ✅ Atualizar status, checklist e histórico
4. ✅ Garantir consistência entre código e documentação

### Ordem correta de desenvolvimento (importante!):
```
1. Monorepo          ← NÃO pular!
2. Banco             ← Base de tudo
3. Auth              ← Segurança primeiro
4. RBAC              ← Permissões
5. Sessões           ← Core do negócio
6. Agenda            ← Funcionalidade
7. Pagamento         ← Monetização
8. Sala 3D offline   ← "Parece tentador, mas é cilada" começar por aqui
9. Realtime          ← Sincronização
10. LiveKit          ← Vídeo
11. Histórico        ← Dados
12. IA               ← Diferencial
13. Admin completo   ← Gestão
14. Testes           ← Qualidade
15. Deploy           ← Produção
```

### Mensagem de cautela:
> "Não comece pela sala 3D. Parece tentador, mas é cilada bonita. Comece pelo esqueleto. Se começar pela sala 3D, você terá uma demo bonita sem produto em volta."

---

*Este documento é a memória viva do projeto. Mantenha-o atualizado.*

**Última atualização:** 2026-06-26
**Versão:** 1.0.0
