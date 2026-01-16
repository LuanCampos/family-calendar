# GitHub Copilot Instructions — Family Calendar

> **🚨 OBRIGATÓRIO: Leia [`CONTRIBUTING.md`](../CONTRIBUTING.md) antes de qualquer alteração.

## Stack
Vite + React 18 + TypeScript + Supabase + IndexedDB — Cloud-first, offline-capable.

## Fluxo de Dados
```
Component → Hook → storageAdapter → Service (Supabase) | offlineAdapter (IndexedDB)
```

## Diretórios Principais
| Camada | Path |
|--------|------|
| Services | `src/lib/services/` |
| Adapters | `src/lib/adapters/` |
| Hooks | `src/hooks/` |
| Components | `src/components/{domain}/` |
| Types | `src/types/` |

## Domínios de Componentes
| Domínio | Path | Responsabilidade |
|---------|------|------------------|
| calendar | `src/components/calendar/` | Grid, header, modais de evento |
| tags | `src/components/tags/` | Gerenciamento de tags |
| family | `src/components/family/` | Setup e gestão de famílias |
| recurring | `src/components/recurring/` | Configuração de recorrência |
| common | `src/components/common/` | Componentes compartilhados |
| ui | `src/components/ui/` | Primitivos shadcn-ui |

## Sufixos de Componentes
| Sufixo | Uso |
|--------|-----|
| `*Modal` | Dialog para criar/editar (ex: `EventModal`) |
| `*View` | Visualização principal (ex: `CalendarView`) |
| `*Grid` | Layout em grid (ex: `CalendarGrid`) |
| `*Header` | Cabeçalho de seção (ex: `CalendarHeader`) |
| `*List` | Lista de itens (ex: `DayEventsList`) |
| `*Manager` | CRUD completo (ex: `TagManager`) |
| `*Config` | Configurações (ex: `RecurrenceConfig`) |

## Regras Críticas

### Eventos Recorrentes
```typescript
// ✅ Criar evento recorrente
const event: EventInput = {
  title: "Reunião semanal",
  date: "2026-01-15",
  isRecurring: true,
  recurrenceRule: { frequency: 'weekly', daysOfWeek: [3] }
};
// ❌ NUNCA armazene instâncias individuais - são geradas on-the-fly
```
- Pai tem `isRecurring: true` + `recurrenceRule`
- Instâncias geradas via `generateRecurringInstances()` (src/lib/utils/recurrenceUtils.ts)
- Exceções em `recurrenceExceptions[]`, customizações em `recurrenceOverrides{}`

### Inputs
```tsx
<Input className="h-10 bg-secondary/50 border-border" />
```

### Cores (NUNCA hardcode)
| Uso | Token |
|-----|-------|
| Fundo cards | `bg-card` |
| Fundo inputs | `bg-secondary/50` |
| Texto | `text-foreground` / `text-muted-foreground` |
| Bordas | `border-border` |

### Segurança
- `logger.*` em vez de `console.*`
- `import.meta.env.*` para credenciais
- `secureStorage` em vez de `localStorage`

### Offline
```tsx
if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
  // IndexedDB
} else {
  // Supabase
}
```
- IDs offline: prefixo `offline:` (ex: `offline:123e4567-e89b`)
- Sync queue automático em `src/lib/storage/offlineStorage.ts`

## Hooks Principais
| Hook | Responsabilidade |
|------|------------------|
| `useEvents` | CRUD de eventos, busca por data range |
| `useEventTags` | CRUD de tags |
| `useRecurringEvents` | Criação/edição de eventos recorrentes |
| `useCalendar` | Estado de navegação do calendário |
| `useFilterTags` | Filtros de tags selecionadas |

## Contexts
| Context | Estado Global |
|---------|---------------|
| `AuthContext` | Sessão do usuário |
| `FamilyContext` | Família ativa + membros |
| `CalendarContext` | Data selecionada, mês atual |
| `OnlineContext` | Status de conexão |
| `LanguageContext` | Idioma (pt/en) |
| `ThemeContext` | Tema claro/escuro |

## Comandos
```bash
npm run dev       # Servidor dev (http://localhost:8081/)
npm run build     # Build produção
npm run build:dev # Build sem minificação
npm run lint      # Verificar ESLint
```

## ⛔ Não Faça
- Chamar Supabase diretamente de componentes (use hooks → adapters)
- `export default` (use named exports)
- Múltiplos componentes por arquivo
- `any` (use `unknown`)
- Cores hardcoded (use tokens Tailwind)
- Armazenar instâncias de eventos recorrentes no DB
- `console.log` (use `logger.*`)

## Path Aliases
```typescript
import { Event } from '@/types';
import { useEvents } from '@/hooks';
import { eventAdapter } from '@/lib/adapters';
import { CalendarGrid } from '@/components/calendar';
```

---

*Documentação completa em [GETTING_STARTED.md](../docs/GETTING_STARTED.md) | Padrões de código em [CONTRIBUTING.md](../CONTRIBUTING.md)*
