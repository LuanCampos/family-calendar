# Padrões de UI - Family Calendar

Este documento define os padrões visuais e de implementação para garantir consistência em toda a aplicação.

---

## 📐 Estrutura de Layout

### Hierarquia de Componentes

```
App
├── Header (fixo no topo)
├── Sidebar (desktop) / FAB Menu (mobile)
└── Main Content
    ├── CalendarGrid / Views
    └── Modais (sobrepondo conteúdo)
```

### Breakpoints Responsivos

| Breakpoint | Prefixo | Uso |
|------------|---------|-----|
| < 640px | (default) | Mobile |
| ≥ 640px | `sm:` | Tablet portrait |
| ≥ 768px | `md:` | Tablet landscape |
| ≥ 1024px | `lg:` | Desktop |

**Padrão mobile-first**: Sempre escreva o estilo mobile primeiro, depois adicione modificadores responsivos.

```tsx
// ✅ CORRETO
className="text-sm sm:text-base md:text-lg"

// ❌ ERRADO (desktop-first)
className="text-lg md:text-base sm:text-sm"
```

---

## 🎨 Sistema de Cores

### Cores Semânticas (usar sempre)

| Token | Uso |
|-------|-----|
| `bg-background` | Fundo principal |
| `bg-card` | Fundo de cards e modais |
| `bg-muted` | Fundo de seções secundárias |
| `bg-primary` | Ações principais, destaque |
| `bg-destructive` | Ações perigosas (deletar) |
| `text-foreground` | Texto principal |
| `text-muted-foreground` | Texto secundário/auxiliar |
| `border-border` | Bordas padrão |
| `border-input` | Bordas de inputs |

### Gradientes Padronizados

```tsx
// Header de modal/card
className="bg-gradient-to-br from-card to-muted/30"

// Footer de modal
className="bg-gradient-to-br from-muted/30 to-card"
```

---

## 📦 Componentes Base (Shadcn-ui)

### Importações Padrão

```tsx
// Sempre importe de @/components/ui/
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ModalContent } from '@/components/ui/modal-content';
```

---

## 🪟 Modais e Dialogs

### Anatomia do Modal

Todo modal segue uma estrutura de **3 zonas** bem definidas:

```
┌─────────────────────────────────────┐
│  HEADER                             │
│  ├─ Título (obrigatório)            │
│  └─ Descrição (apenas se necessário)│
├─────────────────────────────────────┤  ← border-b (linha separadora fina)
│                                     │
│  CONTEÚDO (scrollável)              │
│                                     │
├─────────────────────────────────────┤  ← border-t (linha separadora fina)
│  FOOTER (ações)                     │
└─────────────────────────────────────┘
```

---

### Header do Modal (IMPORTANTE ⚠️)

O header é a primeira impressão do modal. **Deve ser consistente em todos os modais.**

#### Regras do Header:

1. **Título**: Sempre presente, claro e conciso
2. **Descrição**: Apenas se **extremamente necessário** (ex: alertas de confirmação)
3. **Linha separadora**: Sempre usar `border-b` para separar do conteúdo
4. **Sem ações no header**: Botões ficam no footer

#### Estilos Fixos do Header:

| Elemento | Classes | Valor |
|----------|---------|-------|
| Container | `border-b bg-gradient-to-br from-card to-muted/30` | Gradiente sutil + borda |
| Padding | `px-4 sm:px-5 pt-4 pb-3` | Consistente |
| Flex | `flex-shrink-0` | Não encolhe com scroll |
| Título | `text-lg sm:text-xl font-semibold` | 18px/20px, peso 600 |
| Descrição | `text-sm text-muted-foreground mt-1` | 14px, cor secundária |

#### Código do Header:

```tsx
{/* ✅ CORRETO - Header padrão */}
<DialogHeader className="border-b bg-gradient-to-br from-card to-muted/30 px-4 sm:px-5 pt-4 pb-3 flex-shrink-0">
  <DialogTitle className="text-lg sm:text-xl font-semibold">
    {t('modalTitle')}
  </DialogTitle>
  {/* Descrição APENAS se necessário - ex: confirmações */}
  {showDescription && (
    <DialogDescription className="text-sm text-muted-foreground mt-1">
      {t('modalDescription')}
    </DialogDescription>
  )}
</DialogHeader>

{/* ❌ ERRADO - Evitar */}
<DialogHeader className="p-6"> {/* Padding inconsistente */}
  <DialogTitle className="text-2xl"> {/* Fonte muito grande */}
    Título
  </DialogTitle>
  <p>Descrição desnecessária que poderia ser omitida</p>
  <Button>Ação no header</Button> {/* Ações devem ir no footer */}
</DialogHeader>
```

#### Quando usar Descrição:

| Situação | Usar descrição? |
|----------|-----------------|
| Formulário de criação/edição | ❌ Não |
| Lista de itens | ❌ Não |
| Confirmação de exclusão | ✅ Sim |
| Alerta importante | ✅ Sim |
| Ação irreversível | ✅ Sim |

---

### Estrutura Completa do Modal

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <ModalContent size="md"> {/* sm | md | lg */}
    
    {/* ══════════════════════════════════════════════════════════════
        HEADER
        - Título obrigatório
        - Descrição apenas se extremamente necessário
        - border-b cria a linha separadora
    ══════════════════════════════════════════════════════════════ */}
    <DialogHeader className="border-b bg-gradient-to-br from-card to-muted/30 px-4 sm:px-5 pt-4 pb-3 flex-shrink-0">
      <DialogTitle className="text-lg sm:text-xl font-semibold">
        {t('title')}
      </DialogTitle>
    </DialogHeader>

    {/* ══════════════════════════════════════════════════════════════
        CONTEÚDO
        - Scrollável quando necessário
        - Padding consistente
        - gap entre elementos
    ══════════════════════════════════════════════════════════════ */}
    <div className="flex-1 overflow-y-auto space-y-3 p-4 sm:p-5 min-h-0">
      {/* Campos do formulário ou conteúdo */}
    </div>

    {/* ══════════════════════════════════════════════════════════════
        FOOTER
        - border-t cria a linha separadora
        - Botões de ação
        - Gradiente invertido do header
    ══════════════════════════════════════════════════════════════ */}
    <DialogFooter className="border-t bg-gradient-to-br from-muted/30 to-card px-4 sm:px-5 py-3 flex-shrink-0 flex flex-col-reverse sm:flex-row gap-2 justify-between">
      {/* Botão destrutivo (se houver) à esquerda */}
      {onDelete && (
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          {t('delete')}
        </Button>
      )}
      
      {/* Botões de ação à direita */}
      <div className="flex gap-2 ml-auto w-full sm:w-auto">
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
          {t('cancel')}
        </Button>
        <Button size="sm" className="flex-1 sm:flex-none">
          {t('save')}
        </Button>
      </div>
    </DialogFooter>
  </ModalContent>
</Dialog>
```

### Tamanhos de Modal (ModalContent)

| Size | Max Width | Uso |
|------|-----------|-----|
| `sm` | 384px | Confirmações simples |
| `md` | 448px | Formulários padrão (TagManager) |
| `lg` | 512px | Formulários complexos (EventModal) |

### Dialog de Confirmação (AlertDialog)

```tsx
<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent className="sm:max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle>{t('deleteEvent')}</AlertDialogTitle>
      <AlertDialogDescription>
        {t('deleteEventConfirm')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleConfirm}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {t('delete')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 📝 Campos de Formulário

### Input Padrão

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="fieldId" className="text-sm font-medium">
      {t('fieldLabel')} <span className="text-destructive">*</span> {/* Se obrigatório */}
    </Label>
    {isValid && <Check className="h-5 w-5 text-green-600" />} {/* Feedback visual */}
  </div>
  <Input
    id="fieldId"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder={t('placeholder')}
    className={`text-sm h-10 ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
  />
  {hasError && (
    <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
      <AlertCircle className="h-4 w-4" />
      {t('errorMessage')}
    </p>
  )}
</div>
```

### Textarea Padrão

```tsx
<div className="space-y-2">
  <Label htmlFor="description" className="text-sm font-medium">
    {t('description')}
  </Label>
  <Textarea
    id="description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder={t('placeholder')}
    className="min-h-24 sm:min-h-28 text-sm resize-none"
  />
</div>
```

### Campo com Ícone em Card

```tsx
<div className="space-y-2 p-3 rounded-xl border-2 border-border bg-card shadow-sm hover:border-primary hover:shadow-md transition-all duration-200">
  <div className="flex items-center gap-2">
    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
    <Label htmlFor="time" className="text-sm font-medium">
      {t('time')}
    </Label>
  </div>
  <Input
    id="time"
    value={time}
    onChange={(e) => setTime(e.target.value)}
    className="text-sm h-9"
  />
</div>
```

### Checkbox com Label

```tsx
<div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group">
  <Checkbox
    id="checkboxId"
    checked={checked}
    onCheckedChange={(checked) => setChecked(Boolean(checked))}
  />
  <Label
    htmlFor="checkboxId"
    className="text-xs sm:text-sm font-medium cursor-pointer flex-1"
  >
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      {t('label')}
    </div>
  </Label>
</div>
```

### Select Padrão

```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium">{t('selectLabel')}</Label>
  <Select value={value} onValueChange={setValue}>
    <SelectTrigger className="h-10">
      <SelectValue placeholder={t('selectPlaceholder')} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">{t('option1')}</SelectItem>
      <SelectItem value="option2">{t('option2')}</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## 🔘 Botões

### Variantes e Uso

| Variante | Classe | Uso |
|----------|--------|-----|
| `default` | `bg-primary` | Ação principal (Salvar, Criar) |
| `destructive` | `bg-destructive` | Ações perigosas (Deletar) |
| `outline` | `border border-input` | Ação secundária (Cancelar) |
| `ghost` | (transparente) | Ações sutis, ícones |
| `secondary` | `bg-secondary` | Ações alternativas |

### Tamanhos

| Size | Altura | Uso |
|------|--------|-----|
| `default` | h-10 | Padrão |
| `sm` | h-9 | Dentro de modais, formulários compactos |
| `lg` | h-11 | CTAs destacados |
| `icon` | h-10 w-10 | Apenas ícone |

### Botão com Ícone

```tsx
// Ícone à esquerda
<Button size="sm" className="gap-2">
  <Plus className="h-4 w-4" />
  {t('create')}
</Button>

// Apenas ícone
<Button variant="ghost" size="icon" className="h-9 w-9">
  <Trash2 className="h-4 w-4" />
</Button>
```

### Botões de Ação (Icon buttons)

```tsx
// Botão de editar
<Button
  variant="ghost"
  size="sm"
  className="h-9 w-9 p-0 text-primary hover:text-primary hover:bg-primary/10"
>
  <Pencil className="h-4 w-4" />
</Button>

// Botão de deletar
<Button
  variant="ghost"
  size="sm"
  className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

---

## 📋 Listas

### Lista de Itens Clicáveis

```tsx
<div className="space-y-2">
  {items.map((item) => (
    <button
      key={item.id}
      onClick={() => handleClick(item)}
      className={cn(
        'flex-1 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl border-2 transition-all w-full',
        'text-sm sm:text-base text-left',
        'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2',
        'bg-card border-border min-h-[64px] sm:min-h-0'
      )}
    >
      {/* Conteúdo do item */}
    </button>
  ))}
</div>
```

### Estado Vazio (Empty State)

```tsx
<div className="border-2 border-dashed border-border rounded-xl p-6 sm:p-8 bg-muted/30 text-center">
  <p className="text-sm sm:text-base text-muted-foreground font-medium">
    {t('noItems')}
  </p>
  <p className="text-xs text-muted-foreground mt-1.5">
    {t('createFirstItem')}
  </p>
</div>
```

### Lista com Ações

```tsx
<div className="space-y-2.5">
  {items.map(item => (
    <div key={item.id} className="flex items-center gap-2">
      {/* Conteúdo do item */}
      <div className="flex-1 px-3 py-2 rounded-lg bg-muted/30">
        {item.name}
      </div>
      
      {/* Ações */}
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ))}
</div>
```

---

## 🏷️ Tags e Badges

### Tag Selecionável

```tsx
<button
  onClick={() => toggleTag(tag.id)}
  className="px-3 py-2 rounded-full border-2 transition-all text-sm font-medium whitespace-nowrap hover:shadow-md hover:scale-[1.05] active:scale-95 cursor-pointer"
  style={{
    borderColor: isSelected ? tag.color : tag.color + '40',
    backgroundColor: isSelected ? tag.color : tag.color + '15',
    color: isSelected ? getContrastColor(tag.color) : 'hsl(var(--foreground))',
  }}
>
  {isSelected && <span className="mr-2">✓</span>}
  {tag.name}
</button>
```

### Badge de Status

```tsx
// Badge usando componente Shadcn
<Badge variant="default">{t('active')}</Badge>
<Badge variant="secondary">{t('pending')}</Badge>
<Badge variant="destructive">{t('error')}</Badge>
<Badge variant="outline">{t('draft')}</Badge>
```

---

## 💬 Feedback e Mensagens

### Mensagem de Erro

```tsx
<div className="border-2 border-destructive/50 rounded-xl p-3 sm:p-3.5 bg-destructive/10 flex items-start gap-2.5">
  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
  <p className="text-sm text-destructive">{errorMessage}</p>
</div>
```

### Mensagem de Sucesso

```tsx
<div className="border-2 border-green-500/50 rounded-xl p-3 sm:p-3.5 bg-green-500/10 flex items-start gap-2.5">
  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
  <p className="text-sm text-green-600">{successMessage}</p>
</div>
```

### Toast (via hook)

```tsx
import { toast } from '@/hooks/ui/use-toast';

// Sucesso
toast({
  title: t('success'),
  description: t('itemSaved'),
});

// Erro
toast({
  title: t('error'),
  description: error.message,
  variant: 'destructive',
});
```

---

## 📱 Padrões Responsivos

### Touch Targets (Área de Toque)

- **Mínimo**: 44x44px em mobile
- **Recomendado**: 48x48px para ações primárias

```tsx
// Botão com área de toque adequada
className="min-h-[44px] sm:min-h-0"
```

### Espaçamentos Responsivos

```tsx
// Padding
className="p-3 sm:p-4 md:p-5"

// Gap
className="gap-2 sm:gap-3 md:gap-4"

// Margin
className="mt-2 sm:mt-3"
```

### Texto Responsivo

```tsx
// Títulos
className="text-lg sm:text-xl md:text-2xl"

// Texto normal
className="text-sm sm:text-base"

// Texto auxiliar
className="text-xs sm:text-sm"
```

---

## 🎭 Estados Visuais

### Hover e Focus

```tsx
// Card/botão clicável
className="hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"

// Input
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### Disabled

```tsx
className="disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
```

### Loading

```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {isLoading ? t('saving') : t('save')}
</Button>
```

---

## 🔤 Ícones

### Biblioteca Padrão

Usar **Lucide React** para todos os ícones:

```tsx
import { 
  Plus, Trash2, Pencil, Check, X, 
  Clock, Calendar, Settings, User,
  AlertCircle, Loader2, ChevronDown
} from 'lucide-react';
```

### Tamanhos de Ícone

| Contexto | Classe | Tamanho |
|----------|--------|---------|
| Inline com texto | `h-4 w-4` | 16px |
| Botão icon | `h-5 w-5` | 20px |
| Destaque/Header | `h-6 w-6` | 24px |

### Ícone com Cor Semântica

```tsx
<Clock className="h-4 w-4 text-primary" />
<AlertCircle className="h-4 w-4 text-destructive" />
<Check className="h-4 w-4 text-green-600" />
<Sun className="h-4 w-4 text-amber-500" />
```

---

## 📏 Espaçamentos Padrão

### Escala de Spacing

| Token | Valor | Uso |
|-------|-------|-----|
| `0.5` | 2px | Micro gaps |
| `1` | 4px | Inline spacing |
| `1.5` | 6px | Tight spacing |
| `2` | 8px | Compact spacing |
| `2.5` | 10px | Default small |
| `3` | 12px | Default medium |
| `4` | 16px | Default large |
| `5` | 20px | Comfortable |
| `6` | 24px | Spacious |

### Padrões de Space

```tsx
// Entre campos de formulário
className="space-y-2" // ou space-y-3

// Entre seções
className="space-y-4" // ou space-y-6

// Padding de container
className="p-4 sm:p-5"
```

---

## 🧱 Bordas e Arredondamentos

### Border Radius

| Classe | Valor | Uso |
|--------|-------|-----|
| `rounded-md` | 6px | Inputs, botões pequenos |
| `rounded-lg` | 8px | Cards, containers |
| `rounded-xl` | 12px | Modais, seções destacadas |
| `rounded-2xl` | 16px | Modais grandes (mobile) |
| `rounded-full` | 9999px | Tags, avatares, badges |

### Bordas

```tsx
// Borda padrão
className="border border-border"

// Borda destacada
className="border-2 border-border"

// Borda dashed (empty state)
className="border-2 border-dashed border-border"

// Borda com hover
className="border-2 border-border hover:border-primary"
```

---

## ✅ Checklist de Implementação

Antes de submeter um novo componente, verifique:

- [ ] Usa componentes base de `@/components/ui/`
- [ ] Responsivo (mobile-first)
- [ ] Touch targets ≥ 44px em mobile
- [ ] Estados visuais (hover, focus, disabled, loading)
- [ ] Textos via `t()` do i18n
- [ ] Ícones do Lucide React
- [ ] Cores semânticas (tokens do tema)
- [ ] Espaçamentos da escala padrão
- [ ] Acessibilidade (aria-labels, roles, keyboard nav)

---

## 📚 Referência Rápida de Classes

### Containers
```tsx
// Modal content
"flex-1 overflow-y-auto space-y-3 sm:space-y-3 p-4 sm:p-5 min-h-0"

// Card section
"bg-muted/30 p-4 sm:p-4 rounded-xl border-2 border-border"

// Empty state
"border-2 border-dashed border-border rounded-xl p-6 sm:p-8 bg-muted/30 text-center"
```

### Headers
```tsx
// Modal header
"border-b bg-gradient-to-br from-card to-muted/30 px-4 sm:px-5 pt-4 sm:pt-4 pb-3 sm:pb-3 flex-shrink-0"

// Modal title
"text-lg sm:text-xl font-semibold"
```

### Footers
```tsx
// Modal footer
"flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 justify-between border-t px-4 sm:px-5 py-3 sm:py-3 flex-shrink-0 bg-gradient-to-br from-muted/30 to-card"
```

### Inputs
```tsx
// Input base
"text-sm h-10"

// Input com erro
"border-destructive focus-visible:ring-destructive"

// Label
"text-sm font-medium"
```

### Botões
```tsx
// Botão primário em modal
"flex-1 sm:flex-none" size="sm"

// Botão de ícone
"h-9 w-9 p-0"

// Botão destrutivo
"bg-destructive text-destructive-foreground hover:bg-destructive/90"
```

---

*Última atualização: Janeiro 2026*
