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

## Papéis de Execução da IA

Prompts iniciando com `[Planejador]`, `[Executor]` ou `[Revisor]` ativam o papel correspondente.

⚠️ Nenhum papel pode violar:
- Fluxo de dados (Component → Hook → Adapter → Service/Offline)
- Regras Absolutas
- Checklist e Verificação Obrigatória (test/lint/build) quando houver mudanças de código

Se houver conflito entre o plano e estas regras, as regras vencem.

---

### [Planejador]

Objetivo: definir um plano completo e verificável, sem escrever código.

Saída obrigatória: `docs/plan-<nome-curto>.md` contendo:
1. Objetivo da mudança
2. Arquivos a criar/alterar/remover
3. O que muda em cada arquivo (o quê + por quê)
4. Tipos e contratos afetados
5. Chaves de i18n a adicionar (pt.ts e en.ts)
6. Testes a criar/alterar
7. Critérios de conclusão:
   - o que precisa estar verdadeiro para test ✓ lint ✓ build ✓

Regras:
- Considerar impacto em hooks, adapters, páginas e componentes.
- Sempre incluir testes e i18n quando houver texto/regra nova.
- Não escrever código de produção.

---

### [Executor]

Objetivo: implementar exatamente o que está no plano.

Entrada: Markdown gerado pelo Planejador.

Ordem obrigatória de execução:
1. Tipos
2. Hooks
3. Adapters/Services
4. Componentes/Páginas
5. i18n (pt.ts e en.ts)
6. Testes

Deve:
- Alterar apenas os arquivos definidos no plano.
- Seguir Regras Absolutas, tokens de cor, a11y e padrões de erro.
- Criar/atualizar testes co-localizados conforme o plano.

Critério de conclusão obrigatório:
- Código compatível com:
  - `npm run test:run` passando
  - `npm run lint` sem warnings
  - `npm run build` sem erros

Saída:
- Código final dos arquivos modificados/criados
- Testes correspondentes
- Confirmação explícita: `test ✓ lint ✓ build ✓`

Proibido:
- Mudar arquitetura do plano
- Refatorar fora do escopo
- Usar `any`, `console.*` ou cores hardcoded

---

### [Revisor]

Objetivo: validar a implementação contra o plano e as regras do projeto.

Entrada: plano (`.md`), que deverá ser comparado com o código implementado.

Deve verificar:
- Fluxo arquitetural correto (sem Supabase direto em componente)
- Conformidade com Regras Absolutas e tokens de cor
- i18n completo em pt.ts e en.ts
- Testes cobrindo comportamento (incluindo casos de borda relevantes)
- Se a mudança permitiria passar: test ✓ lint ✓ build ✓

Saída obrigatória:
1. ✅ Itens corretos
2. ❌ Problemas encontrados (ação objetiva para corrigir)
3. 📌 Veredito final:
   - `APROVADO`
   - ou `REPROVADO` + lista mínima de ajustes

Proibido:
- Reimplementar a solução
- Sugerir melhorias fora do escopo do plano

Fluxo:
Se `REPROVADO`, este relatório pode ser usado como nova entrada para `[Planejador]`.