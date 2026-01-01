# Copilot Instructions for Family Calendar

## Architecture Overview

**Family Calendar** is a cloud-first, multi-family React calendar app with cloud sync via Supabase. The architecture uses **adapters** to branch logic between online (Supabase) and offline (IndexedDB) data sources.

### Core Principle: Online/Offline Branching
- **eventAdapter** (src/lib/adapters/eventAdapter.ts) is the main entry point for all data operations
- Checks `navigator.onLine` and offline IDs to decide whether to use `eventService` (Supabase) or `offlineAdapter` (IndexedDB)
- On offline failure, automatically falls back to offline storage
- Offline changes queue in `syncQueue` (IndexedDB) and sync when online

### Key Data Flow
1. **Events & Tags** → `storageAdapter` (re-exports from eventAdapter) → routes to `eventService` or `offlineAdapter`
2. **Contexts** provide app-wide state: `AuthContext` (user session), `FamilyContext` (family/members), `CalendarContext` (UI dates), `OnlineContext` (connection status)
3. **Hooks** (`useEvents`, `useEventTags`, `useRecurringEvents`) call adapters and manage state
4. **Components** dispatch to hooks; never call services directly

## Critical Patterns & Conventions

### Adapters Layer (src/lib/adapters/)
- **eventAdapter.ts**: Online/offline branching for events, tags, recurring events. Always use this.
- **offlineAdapter.ts**: Direct IndexedDB access with sync queue. Only used by eventAdapter.
- **storageAdapter.ts**: Re-exports eventAdapter methods for convenience. Use this in components.

**Pattern**: Always check `offlineAdapter.isOfflineId(familyId)` or `navigator.onLine` before deciding data source.

### Recurring Events
- Stored as parent events with `isRecurring: true` and `recurrenceRule` (see `RecurrenceRule` in src/types/calendar.ts)
- **Never stored as individual instances in DB** - instances are generated on-the-fly via `generateRecurringInstances()` (src/lib/utils/recurrenceUtils.ts)
- When fetching events, `eventAdapter.getEvents()` automatically expands recurring parents for the requested date range
- Exceptions/overrides stored in `recurrenceExceptions` (excluded dates) and `recurrenceOverrides` (per-date customizations)

**Why**: Reduces storage, simplifies updates (edit parent once affects all instances)

### Offline Data Model (IndexedDB stores in src/lib/storage/offlineStorage.ts)
- `families`, `family_members`, `events`, `tag_definitions`, `event_tags`, `sync_queue`
- `sync_queue` stores pending operations (events/tags created/updated offline) with `{ operation, data, familyId, timestamp }`
- Offline IDs are UUIDs prefixed with `offline:` (see `generateOfflineId()`)

### Family Context Hierarchy
- Users can belong to multiple families; each has an `owner`, `admin`, or `member` role
- `currentFamilyId` in FamilyContext is the active workspace
- Offline families use IDs prefixed with `offline:` for testing without Supabase
- Family members are synced in `members` array in FamilyContext

## Developer Workflows

### Development
```bash
npm run dev          # Start Vite dev server (http://localhost:8081/)
npm run build        # Production build
npm run build:dev    # Dev build without minification (debugging)
npm run lint         # Check ESLint
```

### Key Tools
- **Vite 5.4** for fast HMR and bundling (vite.config.ts)
- **Shadcn-ui** components (src/components/ui/) - use these for consistency
- **TanStack React Query** for server state (QueryClient in App.tsx)
- **Supabase** for online auth, families, events, tags via `src/lib/services/`
- **date-fns** for date manipulation with locale support (i18n in src/i18n/)

### Debugging
- `src/lib/logger.ts` for structured logging (use `logger.debug()`, `logger.info()`, `logger.error()`)
- Check `localStorage` for auth tokens and family selection
- Inspect IndexedDB (`Application > Storage > Indexed DB > budget-offline-db`) for offline data
- Watch browser DevTools Network tab for Supabase calls

## Import Conventions

Use path aliases (defined in tsconfig.json):
- `@/components` - React components
- `@/contexts` - Context providers
- `@/hooks` - Custom React hooks
- `@/lib` - Core logic (adapters, services, storage, utils)
- `@/types` - TypeScript types
- `@/i18n` - Translations

## Common Tasks

### Add a New Event Field
1. Update `Event` interface in src/types/calendar.ts
2. Update Supabase schema (PostgreSQL events table)
3. Add mapping in `src/lib/mappers.ts` if needed
4. Update `eventAdapter` to handle new field in create/update
5. Update UI components to display/edit field

### Create a Recurring Event
```typescript
// In a component hook:
const { createRecurringEvent } = useEvents();
await createRecurringEvent(familyId, {
  title: "Weekly meeting",
  date: "2026-01-15",
  isRecurring: true,
  recurrenceRule: { frequency: 'weekly', daysOfWeek: [3] } // Wednesday
});
// Instances auto-generated on fetch for any date range
```

### Handle Offline-First Data
- Components use `useOnline()` hook to detect connectivity
- Display sync status via `OnlineStatusBar` component
- Sync queue is automatic—changes made offline queue and sync on reconnect
- No manual sync calls needed in most cases

### Internationalization
- Add keys to src/i18n/translations/{pt,en}.json
- Use `useLanguage()` hook: `const { t } = useLanguage(); <p>{t('key')}</p>`

## Testing Notes
- Offline families (IDs with `offline:` prefix) bypass Supabase entirely
- Use `clearOfflineCache()` to reset IndexedDB for fresh tests
- Test recurring expansion with date ranges to verify correct instance generation
