# Guia do Desenvolvedor — Family Calendar

> **⚠️ LEIA ANTES DE QUALQUER ALTERAÇÃO**
> 
> Consulte também: [GETTING_STARTED.md](docs/GETTING_STARTED.md) para uma introdução ao projeto.

---

## 📋 Checklist de PR

- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa com **zero warnings**
- [ ] Sem `console.*` — use `logger` de `@/lib/logger`
- [ ] Sem credenciais hardcoded — use `import.meta.env.*`
- [ ] Arquivos nomeados conforme taxonomia
- [ ] Um componente por arquivo
- [ ] Tipos explícitos — sem `any`

---

## 🏗️ Arquitetura

**Stack**: Vite + React 18 + TypeScript + Supabase + IndexedDB — Cloud-first, offline-capable.

```
Component → Hook → storageAdapter → Service (Supabase)
                                  ↘ offlineAdapter (IndexedDB)
```

| Camada | Path | Responsabilidade |
|--------|------|------------------|
| Pages | `src/pages/` | Layout, roteamento |
| Components | `src/components/{domain}/` | UI por domínio |
| Hooks | `src/hooks/` | Estado e side effects |
| Adapters | `src/lib/adapters/` | Abstração online/offline |
| Services | `src/lib/services/` | Wrappers Supabase |
| Contexts | `src/contexts/` | Estado global |

### Domínios de Componentes
| Domínio | Path | Responsabilidade |
|---------|------|------------------|
| calendar | `src/components/calendar/` | Grid, header, modais de evento |
| tags | `src/components/tags/` | Gerenciamento de tags |
| family | `src/components/family/` | Setup e gestão de famílias |
| recurring | `src/components/recurring/` | Configuração de recorrência |
| common | `src/components/common/` | Componentes compartilhados |
| ui | `src/components/ui/` | Primitivos shadcn-ui |

---

## 📁 Nomenclatura de Componentes

| Sufixo | Uso | Exemplo |
|--------|-----|---------|
| `*Modal` | Dialog para criar/editar | `EventModal.tsx` |
| `*View` | Visualização principal | `CalendarView.tsx` |
| `*Grid` | Layout em grid | `CalendarGrid.tsx` |
| `*Header` | Cabeçalho de seção | `CalendarHeader.tsx` |
| `*List` | Lista de itens | `DayEventsList.tsx` |
| `*Manager` | CRUD completo | `TagManager.tsx` |
| `*Config` | Configurações | `RecurrenceConfig.tsx` |
| `*Preview` | Visualização prévia | `RecurrencePreview.tsx` |
| `*Panel` | Componente autônomo | `SettingsPanel.tsx` |
| `*Setup` | Fluxo de configuração inicial | `FamilySetup.tsx` |

### ❌ Proibidos
`*Container`, `*Wrapper`, `*Component`

### Outros Arquivos
| Tipo | Padrão | Local |
|------|--------|-------|
| Domain hooks | `use{Domain}.ts` | `src/hooks/` |
| UI hooks | `use-{name}.ts` | `src/hooks/ui/` |
| Services | `{domain}Service.ts` | `src/lib/services/` |
| Adapters | `{domain}Adapter.ts` | `src/lib/adapters/` |

---

## 🪟 Padrão de Modal (OBRIGATÓRIO)

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-card border-border sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
      <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {t('title')}
      </DialogTitle>
    </DialogHeader>
    
    <div className="px-6 py-4 overflow-y-auto">
      <div className="space-y-4">{/* Campos */}</div>
    </div>
    
    <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
      <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
      <Button onClick={onSave}>{t('save')}</Button>
    </div>
  </DialogContent>
</Dialog>
```

**❌ NUNCA use `DialogFooter`** — use div estilizada  
**❌ NUNCA use `bg-background`** em inputs — use `bg-secondary/50`

### Tamanhos
| Uso | Classe |
|-----|--------|
| Confirmações | `sm:max-w-sm` |
| **Padrão** | `sm:max-w-md` |
| Forms complexos | `sm:max-w-lg` |
| Listas | `sm:max-w-xl` |

---

## 🎨 Tokens de Cor (OBRIGATÓRIO)

| Uso | Token |
|-----|-------|
| Fundo página | `bg-background` |
| Fundo cards/modais | `bg-card` |
| Fundo inputs | `bg-secondary/50` |
| Fundo list items | `bg-secondary/30` |
| Texto principal | `text-foreground` |
| Texto secundário | `text-muted-foreground` |
| Bordas | `border-border` |

**❌ PROIBIDO**: `text-gray-500`, `bg-slate-100`, cores hardcoded

---

## 📝 Padrão de Formulário

```tsx
<div className="space-y-1.5">
  <Label className="text-sm font-medium">{t('eventTitle')}</Label>
  <Input className="h-10 bg-secondary/50 border-border" />
</div>
```

---

## 📋 Padrão de Lista

```tsx
<div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg gap-3 group">
  <div className="min-w-0 flex-1">
    <p className="text-foreground text-sm font-medium truncate">{event.title}</p>
  </div>
  <div className="flex items-center gap-1 flex-shrink-0">
    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10">
      <Pencil className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</div>
```

---

## 🔘 Botões

| Ação | Variant |
|------|---------|
| Principal/Salvar | `default` |
| Cancelar | `outline` |
| Deletar | `destructive` |
| Ícone sutil | `ghost` |

**Com loading:**
```tsx
<Button disabled={loading}>
  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {loading ? t('saving') : t('save')}
</Button>
```

---

## 🔤 Ícones (Lucide React)

| Contexto | Tamanho |
|----------|---------|
| Botões | `h-4 w-4` |
| Títulos modal | `h-5 w-5 text-primary` |
| Empty states | `h-6 w-6` |

---

## 🔐 Segurança

| ❌ Proibido | ✅ Correto |
|-------------|------------|
| `console.log(data)` | `logger.debug('context', data)` |
| `const key = 'abc'` | `import.meta.env.VITE_KEY` |
| `.insert(body)` | `.insert(schema.parse(data))` |
| `eval()` | Nunca |
| `dangerouslySetInnerHTML` | Evitar ou sanitizar |
| `localStorage.get(x)` | `secureStorage.getItem(x)` |

### Arquivos de Segurança
| Arquivo | Uso |
|---------|-----|
| `src/lib/logger.ts` | Logger (substitui console) |
| `src/lib/secureStorage.ts` | localStorage validado |
| `src/lib/validators.ts` | Schemas Zod inputs |
| `src/lib/schemas.ts` | Schemas Zod DB |

---

## 🔁 Eventos Recorrentes

Eventos recorrentes **NÃO são armazenados como múltiplas cópias**. Apenas o evento "pai" é salvo com uma regra de recorrência. As instâncias são geradas dinamicamente via `generateRecurringInstances()`.

```typescript
// ✅ Criar evento recorrente
const event: EventInput = {
  title: "Reunião semanal",
  date: "2026-01-15",
  isRecurring: true,
  recurrenceRule: { frequency: 'weekly', daysOfWeek: [3] }
};

// ❌ NUNCA armazene instâncias individuais
```

- **`recurrenceExceptions`**: Datas onde o evento NÃO aparece
- **`recurrenceOverrides`**: Mudanças específicas para uma data

---

## 📴 Offline-First

**Nunca use `navigator.onLine` sozinho:**
```tsx
if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
  await offlineAdapter.put('table', data);
} else {
  const { error } = await service.insert(data);
  if (error) {
    await offlineAdapter.put('table', data);
    await offlineAdapter.sync.add({ type, action: 'insert', data });
  }
}
```

IDs offline têm prefixo `offline:` (ex: `offline:123e4567-e89b-12d3`).

---

## 🪝 Hooks Principais

| Hook | Responsabilidade |
|------|------------------|
| `useEvents` | CRUD de eventos, busca por date range |
| `useEventTags` | CRUD de tags |
| `useRecurringEvents` | Criação/edição de eventos recorrentes |
| `useCalendar` | Estado de navegação do calendário |
| `useFilterTags` | Filtros de tags selecionadas |

---

## 🌐 i18n

| Idioma | Arquivo |
|--------|---------|
| PT | `src/i18n/translations/pt.ts` |
| EN | `src/i18n/translations/en.ts` |

**Regras:**
1. Adicione chaves em **TODOS** os idiomas
2. Mesma ordem de chaves
3. Chaves em camelCase

---

## 🧹 ESLint

- **Zero warnings** — não introduza novos
- **Todas as deps** em useEffect/useCallback
- **Nunca `any`** — use `unknown`

---

## ⛔ Resumo: NÃO Faça

| ❌ | ✅ |
|---|---|
| Chamar Supabase de componentes | Use hooks + storageAdapter |
| `navigator.onLine` sozinho | Verifique `isOfflineId()` primeiro |
| Arquivos na raiz | Use subpastas por domínio |
| Inventar sufixos | Use a taxonomia |
| `export default` | Named exports |
| Múltiplos componentes/arquivo | Um por arquivo |
| `any` | `unknown` ou tipo específico |
| `console.*` | `logger.*` |
| `DialogFooter` | Div estilizada |
| Cores hardcoded | Tokens semânticos |
| Armazenar instâncias recorrentes | Gerar dinamicamente |

---

## 🛠️ Comandos

```bash
npm run dev       # Dev server
npm run build     # Build produção
npm run lint      # ESLint (zero warnings)
```

---

*Se parece errado ou inseguro, provavelmente é. Pergunte antes.*
