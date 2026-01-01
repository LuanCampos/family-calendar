/**
 * User Service - Centralized Supabase API calls for user operations
 * 
 * This service handles all database operations related to:
 * - User preferences (language, theme, current family)
 * - User authentication helpers
 * 
 * All Supabase queries for user-related entities should go through this service.
 */

import { supabase } from '../supabase';

// ============================================================================
// USER PREFERENCE QUERIES
// ============================================================================

export const APPLICATION_KEY = 'calendar';

// Prefer the plural table name (matches app wording and offline store), but
// keep a fallback to older deployments that used the singular name.
const USER_PREFERENCES_TABLE_PRIMARY = 'user_preferences';
const USER_PREFERENCES_TABLE_FALLBACK = 'user_preference';

const isMissingTableError = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;

  // Postgres: undefined_table
  if (err.code === '42P01') return true;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('does not exist') && msg.includes('user_');
};

export interface UserPreference {
  id: string;
  user_id: string;
  application_key: string;
  language: string | null;
  theme: string | null;
  current_family_id: string | null;
  updated_at: string;
}

export const getUserPreferences = async (userId: string) => {
  const primary = await supabase
    .from(USER_PREFERENCES_TABLE_PRIMARY)
    .select('*')
    .eq('user_id', userId)
    .eq('application_key', APPLICATION_KEY)
    .maybeSingle();

  if (primary.error && isMissingTableError(primary.error)) {
    return supabase
      .from(USER_PREFERENCES_TABLE_FALLBACK)
      .select('*')
      .eq('user_id', userId)
      .eq('application_key', APPLICATION_KEY)
      .maybeSingle();
  }

  return primary;
};

export const getCurrentFamilyPreference = async (userId: string) => {
  const primary = await supabase
    .from(USER_PREFERENCES_TABLE_PRIMARY)
    .select('current_family_id')
    .eq('user_id', userId)
    .eq('application_key', APPLICATION_KEY)
    .maybeSingle();

  if (primary.error && isMissingTableError(primary.error)) {
    return supabase
      .from(USER_PREFERENCES_TABLE_FALLBACK)
      .select('current_family_id')
      .eq('user_id', userId)
      .eq('application_key', APPLICATION_KEY)
      .maybeSingle();
  }

  return primary;
};

export const upsertUserPreference = async (payload: {
  // Accept user_id/application_key in payloads coming from the offline sync
  // queue, but never trust them.
  user_id?: string;
  application_key?: string;
  theme?: string;
  language?: string;
  current_family_id?: string | null;
}) => {
  // Use ensureSessionReady to guarantee the token is applied to the client
  const session = await ensureSessionReady();

  // `ensureSessionReady` guarantees `session.user` exists.
  const sessionUserId = session.user.id;

  const finalPayload = {
    ...payload,
    user_id: sessionUserId,
    application_key: APPLICATION_KEY,
    updated_at: new Date().toISOString(),
  };

  const primary = await supabase
    .from(USER_PREFERENCES_TABLE_PRIMARY)
    .upsert(finalPayload, { onConflict: 'user_id,application_key' });

  const result = (primary.error && isMissingTableError(primary.error))
    ? await supabase
        .from(USER_PREFERENCES_TABLE_FALLBACK)
        .upsert(finalPayload, { onConflict: 'user_id,application_key' })
    : primary;

  if (result.error) {
    const meta = result.error as { details?: unknown; hint?: unknown };
    console.error('[USER_PREF] Upsert failed', {
      code: result.error.code,
      message: result.error.message,
      details: meta?.details,
      hint: meta?.hint,
    });
  }

  return result;
};

export const updateCurrentFamily = async (userId: string, familyId: string | null) => {
  const payload = {
    user_id: userId,
    application_key: APPLICATION_KEY,
    current_family_id: familyId,
    updated_at: new Date().toISOString(),
  };

  const primary = await supabase
    .from(USER_PREFERENCES_TABLE_PRIMARY)
    .upsert(payload, { onConflict: 'user_id,application_key' })
    .select()
    .single();

  if (primary.error && isMissingTableError(primary.error)) {
    return supabase
      .from(USER_PREFERENCES_TABLE_FALLBACK)
      .upsert(payload, { onConflict: 'user_id,application_key' })
      .select()
      .single();
  }

  return primary;
};

export const getOrCreateUserPreferences = async (
  userId: string,
  defaults: {
    theme: string;
    language: string;
  }
) => {
  const res = await getUserPreferences(userId);

  if (res.error) {
    return res;
  }

  // Create initial record if missing.
  if (!res.data) {
    const upsertRes = await upsertUserPreference({
      theme: defaults.theme,
      language: defaults.language,
      current_family_id: null,
    });

    const upsertError = (upsertRes as { error: unknown | null }).error;
    if (upsertError) {
      return { data: null, error: upsertError } as typeof res;
    }

    return getUserPreferences(userId);
  }

  // Fill missing fields once (keeps server as source of truth afterwards).
  const prefs = res.data as UserPreference;
  const patch: { theme?: string; language?: string } = {};
  if (!prefs.theme) patch.theme = defaults.theme;
  if (!prefs.language) patch.language = defaults.language;

  if (Object.keys(patch).length > 0) {
    const upsertRes = await upsertUserPreference(patch);
    const upsertError = (upsertRes as { error: unknown | null }).error;
    if (upsertError) {
      // Non-fatal; still return the existing record.
      return res;
    }
    return getUserPreferences(userId);
  }

  return res;
};

// ============================================================================
// AUTH HELPERS
// ============================================================================

export const getSession = async () => {
  return supabase.auth.getSession();
};

/**
 * Ensures the auth session is ready before write operations.
 * 
 * Simply validates that:
 * 1. Session exists
 * 2. User is loaded
 * 3. Access token is present
 * 
 * CRITICAL: Calls this before any INSERT/UPDATE/DELETE operation.
 * If it throws, the error is real (auth issue, RLS policy, etc.) and should not be retried.
 */
export const ensureSessionReady = async () => {
  const { data: { session } } = await getSession();

  if (!session) {
    throw new Error('No active session - user not authenticated');
  }

  if (!session.access_token) {
    throw new Error('Session access token not ready yet');
  }

  if (!session.user) {
    throw new Error('Session user data not loaded');
  }

  return session;
};
