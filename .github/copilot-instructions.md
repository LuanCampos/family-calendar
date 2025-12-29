# AI Coding Agent Instructions: Family Calendar

## Project Overview

**Family Calendar** is a cloud-first, multi-user family calendar built with React, TypeScript, Vite, and Supabase. It features offline-first architecture with automatic sync, multi-family support, event tagging, and i18n (Portuguese/English).

**Key Insight:** This is an offline-first app where the architecture uses **adapter pattern** to branch between online (Supabase) and offline (IndexedDB) operations seamlessly.

---

## Architecture: The Three Core Layers

### 1. **Contexts Layer** (`src/contexts/`)
Manages global state and side effects via React Context:

- `AuthContext` - User auth via Supabase
- `FamilyContext` - Currently selected family, multi-family switching
- `OnlineContext` - Online/offline status & background sync orchestration
- `CalendarContext` - Calendar view state (month, selected date)
- `LanguageContext` - i18n (Portuguese/English)
- `ThemeContext` - Dark/light mode

**Pattern:** Contexts initialize their own providers at app level in `App.tsx` with TanStack Query for data fetching.

### 2. **Adapters Layer** (`src/lib/adapters/`)
The critical online/offline branching logic:

```
storageAdapter (main entry)
├── eventAdapter (routes to online/offline)
├── offlineAdapter (IndexedDB operations)
└── eventService (Supabase API calls)
```

**How It Works:**
- `eventAdapter` checks `offlineAdapter.isOfflineId(familyId)` or `navigator.onLine`
- If offline → uses `offlineAdapter` (IndexedDB)
- If online → tries `eventService` (Supabase), falls back to offline on error
- Online responses automatically sync to IndexedDB via `offlineAdapter.syncEvents()`

**Critical Pattern:** Every data operation goes through adapters, never directly to Supabase. This ensures offline capability is maintained.

### 3. **Services Layer** (`src/lib/services/`)
Supabase API wrappers:
- `eventService` - CRUD for events & tags
- `familyService` - Family management & sync
- `userService` - User profile operations

---

## Key Data Flows

### Creating an Event
```
useEvents hook
  ↓
storageAdapter.createEvent()
  ↓
eventAdapter.createEvent() [checks online status]
  ├─ Online → eventService.createEvent() → Supabase
  └─ Offline → offlineAdapter.createEvent() → IndexedDB
  ↓
Updates local component state + logs with logger.info()
```

### Syncing Offline Changes
`OnlineContext` manages sync orchestration:
1. Detects online status change
2. Calls `syncFamily()` for each offline family
3. Fetches offline family from Supabase
4. Creates new online family with offline data
5. Syncs events & tags from IndexedDB to online family
6. Updates local family ID references

---

## Important Patterns & Conventions

### 1. **Family IDs Signal Online/Offline State**
- Online families: UUIDs from Supabase
- Offline families: prefixed with `offline-` (e.g., `offline-uuid`)
- Always check `offlineAdapter.isOfflineId(familyId)` before routing

### 2. **Structured Logging**
```typescript
logger.info('event.created', { eventId: '123', familyId: 'abc' });
logger.error('event.create.error', { error: err, payload });
logger.debug('sync.start', { queueLength }); // dev only
```
**Pattern:** Use dot-notation events (`event.created`, `sync.failed`) with context objects.

### 3. **Error Handling with Fallbacks**
Always fallback to offline when online fails:
```typescript
try {
  if (!navigator.onLine) return offlineAdapter.getEvents(...);
  const resp = await eventService.getEvents(...);
  if (resp.error) return offlineAdapter.getEvents(...);
  return resp.data;
} catch (error) {
  return offlineAdapter.getEvents(...); // fallback
}
```

### 4. **Type Safety**
- All calendar types in `src/types/calendar.ts` (Event, EventInput, EventTag, EventTagInput)
- Database types in `src/types/database.ts` (PostgreSQL schema)
- Import types with `import type` to avoid circular imports

### 5. **Hook Dependencies**
Hooks depend on contexts that must be wrapped:
- `useEvents` → needs `FamilyContext` + `AuthContext`
- `useAuth` → must be within `AuthProvider`
- `useOnline` → must be within `OnlineProvider`

---

## Development Workflow

### Build & Run
```bash
npm run dev          # Vite dev server on port 8080
npm run build        # Production build
npm run build:dev    # Dev build (no minification, useful for debugging)
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### Local Testing
- Dev server runs on `http://localhost:8080/family-calendar/`
- Use browser DevTools → Application tab → IndexedDB to inspect offline storage
- Toggle offline mode: DevTools → Network → Offline checkbox

### Common Debugging
- Check `logger` output in console (structured logs with timestamps)
- Inspect sync progress: `OnlineContext` exposes `isSyncing` and `syncProgress`
- Family switching: `FamilyContext.currentFamilyId` tells you which family is active

---

## UI Component Organization

### `src/components/`
- `calendar/` - CalendarGrid, CalendarHeader, EventModal
- `tags/` - TagManager for event categorization
- `family/` - FamilySetup (offline), FamilyManager (multi-family switching)
- `ui/` - shadcn/ui primitives (Button, Dialog, Input, etc.)
- `common/` - OnlineStatusBar (shows online/offline + sync progress)
- `settings/` - SettingsPanel (theme, language)

**Pattern:** Components are domain-organized, not generic "buttons" folders.

---

## External Dependencies
- **Supabase** - PostgreSQL backend, auth, realtime (config in `src/lib/supabase.ts`)
- **TanStack Query** - HTTP caching & sync (QueryClient in `App.tsx`)
- **shadcn/ui** - Radix UI + Tailwind component library
- **date-fns** - Date formatting & manipulation
- **react-hook-form** - Form handling in dialogs/modals

---

## When Adding New Features

1. **Add to adapters first** - Implement in `eventAdapter` with online/offline branching
2. **Then add services** - Create Supabase API calls in `eventService` if online-only
3. **Expose via hooks** - Create custom hook (e.g., `useExpenses`) that uses adapters
4. **Wire to UI** - Build components that call the hook
5. **Log important events** - Use `logger.info()` for tracking user actions
6. **Update types** - Ensure TypeScript definitions exist in `src/types/`

---

## Gotchas & Common Mistakes

- ❌ Never import directly from `eventService` in components - always use adapters
- ❌ Don't forget the offline fallback in error handlers
- ❌ Family context can be `null` during loading - always check `currentFamilyId`
- ❌ Tags are family-scoped, not global - always filter by `familyId`
- ✅ Use `storageAdapter` as the single entry point for all data operations
- ✅ Always check `navigator.onLine` or `offlineAdapter.isOfflineId()` before routing

---

## File Reference Map

| Purpose | File |
|---------|------|
| Type definitions | [`src/types/calendar.ts`](src/types/calendar.ts), [`src/types/database.ts`](src/types/database.ts) |
| Adapter routing | [`src/lib/adapters/storageAdapter.ts`](src/lib/adapters/storageAdapter.ts) |
| Online/offline branching | [`src/lib/adapters/eventAdapter.ts`](src/lib/adapters/eventAdapter.ts) |
| Offline storage | [`src/lib/storage/offlineStorage.ts`](src/lib/storage/offlineStorage.ts) |
| Supabase config | [`src/lib/supabase.ts`](src/lib/supabase.ts) |
| Logging | [`src/lib/logger.ts`](src/lib/logger.ts) |
| Event CRUD hook | [`src/hooks/useEvents.ts`](src/hooks/useEvents.ts) |
| i18n setup | [`src/i18n/index.ts`](src/i18n/index.ts) |
