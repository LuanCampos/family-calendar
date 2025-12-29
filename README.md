# Family Calendar

[![Release](https://img.shields.io/badge/release-v1.0-blue)](https://github.com/luancampos/family-calendar/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-blueviolet)](https://luancampos.github.io/family-calendar/)

A cloud-first, multi-user family calendar built with Vite, React, and TypeScript. Organize family events with tags, manage multiple families, and work seamlessly online or offline with automatic sync.

**Live demo:** https://luancampos.github.io/family-calendar/

## Key Features

- 📅 **Interactive Calendar** - Month view with intuitive date selection and event visualization
- 🏷️ **Event Tagging System** - Create custom tags to organize and categorize events
- 👥 **Multi-Family Support** - Manage events for multiple families with offline capability
- 🌐 **Cloud Collaboration** - Real-time sync via Supabase for shared family workspaces
- 📱 **Offline-First** - Full offline capability with IndexedDB persistence and automatic background sync
- 🌍 **Internationalization** - Full support for Portuguese and English
- 🎨 **Modern UI** - Built with React, TypeScript, Tailwind CSS, and shadcn-ui components
- ⚡ **Fast & Responsive** - Powered by Vite for instant development experience

## Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Offline Storage:** IndexedDB
- **Date Handling:** date-fns with locale support
- **Build Tool:** Vite 5.4.21

## Project Structure

```
src/
├── components/          # React components organized by domain
│   ├── calendar/       # Calendar grid, header, event modal
│   ├── tags/           # Tag management interface
│   ├── family/         # Family setup and management
│   ├── common/         # Shared components (online status, etc.)
│   └── ui/            # shadcn-ui primitives
├── hooks/              # Custom React hooks
│   ├── useCalendar.ts
│   ├── useEvents.ts
│   ├── useEventTags.ts
│   └── ui/            # UI-only hooks
├── contexts/           # React contexts (Auth, Family, Language, Theme, etc.)
├── lib/                # Core logic layer
│   ├── adapters/      # Online/offline branching logic
│   ├── services/      # Supabase API calls
│   ├── storage/       # IndexedDB utilities
│   └── utils/         # Helpers and utilities
├── types/              # TypeScript type definitions
└── i18n/              # Internationalization (Portuguese & English)
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/luancampos/family-calendar.git
cd family-calendar
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open your browser at `http://localhost:8081/family-calendar/` (or the URL Vite prints).

### Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Other Commands

- **Lint:** `npm run lint` - Check code quality with ESLint
- **Build (dev mode):** `npm run build:dev` - Build without minification

## Key Architecture Patterns

### Offline-First Design

The app supports three operational modes:

1. **Online Family** - Full cloud sync with Supabase, with offline fallback to IndexedDB
2. **Temporarily Offline** - Online family without network, uses IndexedDB with sync queue
3. **Offline Family** - No authentication, persistent local IndexedDB storage

### Data Layer

- **Services** (`src/lib/services/*`) - Thin Supabase wrappers
- **Adapters** (`src/lib/adapters/*`) - Online/offline branching logic
- **Hooks** - Orchestration layer for state management
- **Contexts** - Global state (auth, family, language, theme, online status)

### Component Organization

- **Presentational** - No direct DB access, use hooks and props
- **Organized by domain** - `components/calendar/`, `components/tags/`, etc.
- **Named exports** - For consistency and tree-shaking

## Usage Scenarios

### Creating Events

1. Click on a date to create a new event
2. Add title, description, and time (or mark as all-day)
3. Optionally assign tags for categorization
4. Save - the event syncs automatically if online

### Managing Tags

1. Open the tag manager from the header
2. Create custom tags with colors
3. Edit or delete tags as needed
4. Tags are shared across all events in the family

### Offline Work

- Create events, tags, and manage the calendar offline
- Changes are stored in IndexedDB
- When online, changes sync automatically to Supabase
- No data loss, fully transparent sync

## Contributing

- Open an issue to propose changes or report bugs
- Create a branch for your feature: `git checkout -b feat/your-feature`
- Keep changes focused and maintainable
- Use existing `src/components/ui/*` primitives for UI consistency
- Follow TypeScript strict mode and ESLint rules

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Português (pt-BR)

Um calendário familiar cloud-first e multiusuário construído com Vite, React e TypeScript. Organize eventos familiares com tags, gerencie múltiplas famílias e trabalhe sem problemas online ou offline com sincronização automática.

**Demo ao vivo:** https://luancampos.github.io/family-calendar/

### Principais Funcionalidades

- 📅 **Calendário Interativo** - Visualização mensal com seleção de data intuitiva e visualização de eventos
- 🏷️ **Sistema de Tags para Eventos** - Crie tags personalizadas para organizar eventos
- 👥 **Suporte Multi-Família** - Gerencie eventos de múltiplas famílias com capacidade offline
- 🌐 **Colaboração Cloud** - Sincronização em tempo real via Supabase para espaços familiares compartilhados
- 📱 **Offline-First** - Capacidade total offline com persistência em IndexedDB e sincronização automática em background
- 🌍 **Internacionalização** - Suporte completo para Português e Inglês
- 🎨 **Interface Moderna** - Construído com React, TypeScript, Tailwind CSS e componentes shadcn-ui
- ⚡ **Rápido e Responsivo** - Alimentado por Vite para uma experiência de desenvolvimento instantânea

### Stack de Tecnologia

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Armazenamento Offline:** IndexedDB
- **Manipulação de Datas:** date-fns com suporte a locales
- **Ferramenta de Build:** Vite 5.4.21

### Começando

#### Pré-requisitos

- Node.js 18+
- npm ou bun

#### Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/luancampos/family-calendar.git
cd family-calendar
npm install
```

#### Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra seu navegador em `http://localhost:8081/family-calendar/` (ou na URL que o Vite exibir).

#### Build

Construir para produção:

```bash
npm run build
```

Visualizar o build de produção:

```bash
npm run preview
```

#### Outros Comandos

- **Lint:** `npm run lint` - Verificar qualidade do código com ESLint
- **Build (modo dev):** `npm run build:dev` - Construir sem minificação

### Padrões de Arquitetura

#### Design Offline-First

O app suporta três modos operacionais:

1. **Família Online** - Sincronização cloud completa com Supabase, com fallback offline para IndexedDB
2. **Temporariamente Offline** - Família online sem rede, usa IndexedDB com fila de sincronização
3. **Família Offline** - Sem autenticação, armazenamento persistente local em IndexedDB

#### Camada de Dados

- **Serviços** (`src/lib/services/*`) - Wrappers finos do Supabase
- **Adaptadores** (`src/lib/adapters/*`) - Lógica de branching online/offline
- **Hooks** - Camada de orquestração para gerenciamento de estado
- **Contextos** - Estado global (autenticação, família, idioma, tema, status online)

### Cenários de Uso

#### Criando Eventos

1. Clique em uma data para criar um novo evento
2. Adicione título, descrição e horário (ou marque como o dia inteiro)
3. Opcionalmente atribua tags para categorização
4. Salve - o evento sincroniza automaticamente se online

#### Gerenciando Tags

1. Abra o gerenciador de tags no header
2. Crie tags personalizadas com cores
3. Edite ou delete tags conforme necessário
4. Tags são compartilhadas entre todos os eventos da família

#### Trabalho Offline

- Crie eventos, tags e gerencie o calendário offline
- Mudanças são armazenadas em IndexedDB
- Quando online, mudanças sincronizam automaticamente para Supabase
- Sem perda de dados, sincronização totalmente transparente

### Contribuindo

- Abra uma issue para propor mudanças ou reportar bugs
- Crie uma branch para sua funcionalidade: `git checkout -b feat/sua-funcionalidade`
- Mantenha mudanças focadas e sustentáveis
- Use componentes existentes em `src/components/ui/*` para consistência de UI
- Siga o TypeScript strict mode e regras de ESLint

### Licença

Este projeto está licenciado sob a Licença MIT — veja o arquivo [LICENSE](LICENSE) para detalhes.

