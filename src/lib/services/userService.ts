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
  return supabase
    .from('user_preference')
    .select('*')
    .eq('user_id', userId)
    .eq('application_key', APPLICATION_KEY)
    .maybeSingle();
};

export const getCurrentFamilyPreference = async (userId: string) => {
  return supabase
    .from('user_preference')
    .select('current_family_id')
    .eq('user_id', userId)
    .eq('application_key', APPLICATION_KEY)
    .maybeSingle();
};

export const upsertUserPreference = async (payload: {
  theme?: string;
  language?: string;
  current_family_id?: string | null;
}) => {
  // Use ensureSessionReady to guarantee the token is applied to the client
  const session = await ensureSessionReady();

  const finalPayload = {
    user_id: session.user!.id,
    application_key: APPLICATION_KEY,
    ...payload,
    updated_at: new Date().toISOString(),
  };

  const result = await supabase
    .from('user_preference')
    .upsert(finalPayload, { onConflict: 'user_id,application_key' });

  if (result.error) {
    console.error('[USER_PREF] Upsert failed', {
      code: result.error.code,
      message: result.error.message,
      details: (result.error as any).details,
      hint: (result.error as any).hint,
    });
  }

  return result;
};

export const updateCurrentFamily = async (userId: string, familyId: string | null) => {
  return supabase
    .from('user_preference')
    .upsert({
      user_id: userId,
      application_key: APPLICATION_KEY,
      current_family_id: familyId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,application_key' })
    .select()
    .single();
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
