# Guia para Iniciantes — Family Calendar

Bem-vindo! Este documento explica o que é essa aplicação e como você pode contribuir.

---

## 🎯 O que é essa aplicação?

É um **calendário familiar** que funciona no navegador. Permite:

- Criar e gerenciar eventos com data, hora e descrição
- Organizar eventos usando tags coloridas
- Criar eventos recorrentes (diários, semanais, mensais)
- Compartilhar calendário com a família
- Funcionar mesmo sem internet (offline)

---

## 🛠️ Tecnologias Usadas

| Tecnologia | Para quê serve |
|------------|----------------|
| **React** | Criar a interface (botões, formulários, etc.) |
| **TypeScript** | JavaScript com tipos (menos bugs) |
| **Vite** | Servidor de desenvolvimento rápido |
| **Tailwind CSS** | Estilizar componentes com classes |
| **shadcn/ui** | Componentes prontos (botões, modais, inputs) |
| **Supabase** | Banco de dados na nuvem + autenticação |
| **IndexedDB** | Banco de dados local (para funcionar offline) |
| **date-fns** | Manipulação de datas |

---

## 📁 Estrutura de Pastas

```
src/
├── components/     → Componentes visuais (botões, cards, modais)
│   ├── calendar/   → Grid do calendário, eventos, modais
│   ├── tags/       → Gerenciamento de tags
│   ├── family/     → Setup e gestão de famílias
│   ├── recurring/  → Configuração de eventos recorrentes
│   ├── common/     → Componentes usados em várias partes
│   └── ui/         → Componentes base (Button, Input, Dialog)
│
├── hooks/          → Lógica reutilizável (ex: buscar eventos)
├── pages/          → Páginas da aplicação
├── contexts/       → Estado global (usuário logado, tema, etc.)
├── lib/            → Utilitários e conexão com banco
│   ├── services/   → Funções que falam com Supabase
│   ├── adapters/   → Decide se usa online ou offline
│   ├── storage/    → Funções do IndexedDB
│   └── utils/      → Helpers (ex: gerar instâncias recorrentes)
├── types/          → Definições de tipos TypeScript
└── i18n/           → Traduções (Português e Inglês)
```

---

## 🔄 Como os Dados Fluem

```
Usuário clica → Componente → Hook → Adapter → Banco de dados
                                      ↓
                              Online? → Supabase
                              Offline? → IndexedDB
```

**Exemplo:** Usuário cria um evento:
1. Clica em uma data no calendário
2. Componente `EventModal` aparece
3. Usuário preenche título, hora, tags e salva
4. Hook `useEvents` é chamado
5. Adapter verifica se está online
6. Salva no Supabase (ou IndexedDB se offline)

---

## 📝 Tipos de Componentes

| Nome termina em... | O que faz | Exemplo |
|--------------------|-----------|---------|
| `*Modal` | Dialog para criar/editar algo | `EventModal` |
| `*View` | Visualização principal | `CalendarView` |
| `*Grid` | Layout em grid | `CalendarGrid` |
| `*Header` | Cabeçalho de seção | `CalendarHeader` |
| `*List` | Lista de itens | `DayEventsList` |
| `*Manager` | CRUD completo de uma entidade | `TagManager` |
| `*Config` | Configurações | `RecurrenceConfig` |

---

## 🔁 Eventos Recorrentes — Como Funciona

### Conceito Principal
Eventos recorrentes **NÃO são armazenados como múltiplas cópias**. Apenas o evento "pai" é salvo no banco com uma regra de recorrência. As instâncias são **geradas dinamicamente** quando você visualiza o calendário.

### Estrutura de um Evento Recorrente
```typescript
// Evento pai (salvo no banco)
{
  id: "abc123",
  title: "Reunião semanal",
  date: "2026-01-15",        // Data de início
  isRecurring: true,         // Marca como recorrente
  recurrenceRule: {
    frequency: 'weekly',     // daily, weekly, biweekly, monthly, yearly
    daysOfWeek: [3],         // Quarta-feira (0=Dom, 6=Sáb)
    endDate: "2026-12-31"    // Quando para de repetir (opcional)
  }
}
```

### Exceções e Modificações
- **`recurrenceExceptions`**: Datas onde o evento NÃO aparece (ex: feriado)
- **`recurrenceOverrides`**: Mudanças específicas para uma data (ex: horário diferente)

```typescript
{
  recurrenceExceptions: ["2026-03-18"],  // Pula esta data
  recurrenceOverrides: {
    "2026-02-12": { time: "15:00" }       // Neste dia, horário diferente
  }
}
```

---

## 🚀 Comandos Básicos

```bash
# Instalar dependências (só na primeira vez)
npm install

# Rodar em desenvolvimento
npm run dev

# Verificar erros de código
npm run lint

# Criar versão de produção
npm run build
```

O servidor roda em `http://localhost:8081/`

---

## ✅ Antes de Enviar Código

1. **Rode o lint:** `npm run lint` (deve ter 0 erros)
2. **Rode o build:** `npm run build` (deve funcionar)
3. **Teste offline:** No Chrome DevTools → Network → marque "Offline"

---

## 🎨 Dicas de Estilo

### Cores — Use tokens, não valores fixos

```tsx
// ❌ Errado
<div className="bg-gray-100 text-gray-600">

// ✅ Certo
<div className="bg-secondary/50 text-muted-foreground">
```

### Tokens disponíveis

| Uso | Token |
|-----|-------|
| Fundo de cards | `bg-card` |
| Fundo de inputs | `bg-secondary/50` |
| Texto principal | `text-foreground` |
| Texto secundário | `text-muted-foreground` |
| Bordas | `border-border` |

### Inputs sempre assim

```tsx
<Input className="h-10 bg-secondary/50 border-border" />
```

### Nunca use console.log

```tsx
// ❌ Errado
console.log('evento:', event);

// ✅ Certo
import { logger } from '@/lib/logger';
logger.debug('evento:', event);
```

---

## ❓ Dúvidas Comuns

**P: Onde crio um componente novo?**
R: Na pasta do domínio (`calendar/`, `tags/`, `family/`). Se for genérico, em `common/`.

**P: Como adiciono texto traduzível?**
R: Em `src/i18n/translations/pt.ts` e `en.ts`. Use a mesma chave nos dois.

**P: Posso usar `any` no TypeScript?**
R: Não. Use `unknown` ou o tipo correto.

**P: Como testo se funciona offline?**
R: No Chrome DevTools → Network → marque "Offline".

**P: Posso usar `export default`?**
R: Não. Sempre use named exports: `export { MinhaFuncao }`.

**P: Como crio um evento recorrente no código?**
R: Use o hook `useRecurringEvents`:
```typescript
const { createRecurringEvent } = useRecurringEvents();
await createRecurringEvent({
  title: "Aniversário",
  date: "2026-05-20",
  isRecurring: true,
  recurrenceRule: { frequency: 'yearly' }
});
```

---

## 📂 Hooks Principais

| Hook | Para quê serve |
|------|----------------|
| `useEvents` | Criar, editar, deletar e buscar eventos |
| `useEventTags` | Gerenciar tags de eventos |
| `useRecurringEvents` | Criar/editar eventos recorrentes |
| `useCalendar` | Navegação do calendário (mês atual, data selecionada) |
| `useFilterTags` | Filtrar eventos por tags selecionadas |

---

## 🌐 Contexts (Estado Global)

| Context | O que guarda |
|---------|--------------|
| `AuthContext` | Usuário logado, token de sessão |
| `FamilyContext` | Família ativa, membros da família |
| `CalendarContext` | Data selecionada, mês sendo visualizado |
| `OnlineContext` | Se está conectado à internet |
| `LanguageContext` | Idioma atual (pt/en) |
| `ThemeContext` | Tema claro ou escuro |

---

## 🔌 Modo Offline

### Como funciona
1. **Online**: Dados vão para o Supabase (nuvem)
2. **Offline**: Dados ficam no IndexedDB (navegador)
3. **Reconectou**: Dados pendentes sincronizam automaticamente

### IDs Offline
IDs de famílias/eventos criados offline têm prefixo `offline:`:
```
offline:123e4567-e89b-12d3-a456-426614174000
```

### Testar Offline
1. Abra o Chrome DevTools (F12)
2. Vá em "Network"
3. Marque "Offline"
4. Use o app normalmente
5. Desmarque "Offline" para sincronizar

---

## 📚 Próximos Passos

1. Rode `npm run dev` e explore a aplicação
2. Leia o código de um componente simples como `CalendarHeader.tsx`
3. Tente fazer uma pequena alteração visual
4. Crie uma família offline e adicione alguns eventos
5. Leia o [CONTRIBUTING.md](../CONTRIBUTING.md) antes de fazer um PR

---

*Boa sorte! Se tiver dúvidas, pergunte. 🚀*
