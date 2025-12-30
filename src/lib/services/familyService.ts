/**
 * Family Service - Centralized Supabase API calls for family operations
 * 
 * This service handles all database operations related to:
 * - Families (CRUD)
 * - Family members (CRUD)
 * - Family invitations (CRUD)
 * 
 * All Supabase queries for these entities should go through this service.
 * 
 * IMPORTANT: Write operations ensure session is ready before executing to prevent 403 RLS errors.
 */

import { supabase } from '../supabase';
import * as userService from './userService';
import { logger } from '../logger';

// ============================================================================
// FAMILY QUERIES
// ============================================================================

export const getFamiliesByUser = async (userId: string) => {
  logger.apiCall('GET', 'family_member', { userId });
  const result = await supabase
    .from('family_member')
    .select('family_id')
    .eq('user_id', userId);
  
  if (result.error) {
    logger.apiResponse('GET', 'family_member', 400, { error: result.error.message });
    return result;
  }
  
  logger.apiResponse('GET', 'family_member', 200, { count: result.data?.length });
  
  if (!result.data || result.data.length === 0) {
    return { data: [], error: null };
  }

  // Get family details separately to avoid RLS issues with joins
  const familyIds = result.data.map(fm => fm.family_id);

  const familiesResult = await supabase
    .from('family')
    .select('id, name, created_by, created_at')
    .in('id', familyIds);

  if (familiesResult.error) {
    logger.error('getFamiliesByUser: error fetching families', familiesResult.error);
    return familiesResult;
  }

  // Format as the original query expected
  const formattedData = familiesResult.data?.map(family => ({
    family_id: family.id,
    family: family
  })) || [];

  return { data: formattedData, error: null };
};

export const insertFamily = async (name: string) => {
  // Ensure session is ready before INSERT to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  logger.apiCall('POST', 'family', { name });
  // Use insert + select to get the inserted row back
  const result = await supabase
    .from('family')
    .insert({ name })
    .select()
    .single();
  
  if (result.error) {
    logger.apiResponse('POST', 'family', 400, { error: result.error.message, code: (result.error as any).code });
    return result;
  }
  
  if (!result.data) {
    logger.error('insertFamily: No data returned from INSERT', { name });
    return { data: null, error: new Error('No data returned from INSERT') };
  }
  
  logger.apiResponse('POST', 'family', 201, { familyId: result.data.id });
  return result;
};

export const updateFamilyName = async (familyId: string, name: string) => {
  // Ensure session is ready before UPDATE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  logger.apiCall('PATCH', `family/${familyId}`, { name });
  const result = await supabase
    .from('family')
    .update({ name })
    .eq('id', familyId);
  logger.apiResponse('PATCH', `family/${familyId}`, result.error ? 400 : 200);
  return result;
};

export const deleteFamily = async (familyId: string) => {
  // Ensure session is ready before DELETE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  logger.apiCall('DELETE', `family/${familyId}`);
  const result = await supabase
    .from('family')
    .delete()
    .eq('id', familyId);
  logger.apiResponse('DELETE', `family/${familyId}`, result.error ? 400 : 200);
  return result;
};

// ============================================================================
// FAMILY MEMBER QUERIES
// ============================================================================

export const getMembersByFamily = async (familyId: string) => {
  logger.apiCall('GET', `family_member?family_id=${familyId}`);
  const result = await supabase
    .from('family_member')
    .select('*')
    .eq('family_id', familyId);
  logger.apiResponse('GET', `family_member?family_id=${familyId}`, result.error ? 400 : 200, { count: result.data?.length });
  return result;
};

export const insertFamilyMember = async (payload: {
  family_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  user_email?: string | null;
}) => {
  // Ensure session is ready before INSERT to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  logger.apiCall('POST', 'family_member', { familyId: payload.family_id, userId: payload.user_id });
  // Use upsert in case the member was already created by a trigger
  const result = await supabase
    .from('family_member')
    .upsert(payload, { onConflict: 'family_id,user_id' })
    .select()
    .single();
  logger.apiResponse('POST', 'family_member', result.error ? 400 : 201);
  return result;
};

export const updateMemberRole = async (memberId: string, role: string) => {
  // Ensure session is ready before UPDATE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase
    .from('family_member')
    .update({ role })
    .eq('id', memberId);
};

export const deleteMember = async (memberId: string) => {
  // Ensure session is ready before DELETE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase
    .from('family_member')
    .delete()
    .eq('id', memberId);
};

export const deleteMemberByFamilyAndUser = async (familyId: string, userId: string) => {
  // Ensure session is ready before DELETE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase
    .from('family_member')
    .delete()
    .eq('family_id', familyId)
    .eq('user_id', userId);
};

export const deleteMembersByFamily = async (familyId: string) => {
  // Ensure session is ready before DELETE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase
    .from('family_member')
    .delete()
    .eq('family_id', familyId);
};

// ============================================================================
// FAMILY INVITATION QUERIES
// ============================================================================

export const getInvitationsByEmail = async (email: string) => {
  logger.apiCall('GET', `family_invitation?email=${email}`);
  const result = await supabase
    .from('family_invitation')
    .select(`
      *,
      family:family_id (
        name
      )
    `)
    .eq('email', email)
    .eq('status', 'pending');
  logger.apiResponse('GET', `family_invitation?email=${email}`, result.error ? 400 : 200, { count: result.data?.length });
  return result;
};

export const getInvitationsByEmailSimple = async (email: string) => {
  logger.apiCall('GET', `family_invitation?email=${email}`);
  const result = await supabase
    .from('family_invitation')
    .select('*')
    .eq('email', email)
    .eq('status', 'pending');
  logger.apiResponse('GET', `family_invitation?email=${email}`, result.error ? 400 : 200, { count: result.data?.length });
  return result;
};

export const getInvitationsByFamily = async (familyId: string) => {
  logger.apiCall('GET', `family_invitation?family_id=${familyId}`);
  const result = await supabase
    .from('family_invitation')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'pending');
  logger.apiResponse('GET', `family_invitation?family_id=${familyId}`, result.error ? 400 : 200, { count: result.data?.length });
  return result;
};

export const getFamilyNamesByIds = async (familyIds: string[]) => {
  return supabase
    .from('family')
    .select('id, name')
    .in('id', familyIds);
};

export const insertInvitation = async (payload: {
  family_id: string;
  email: string;
  invited_by: string;
  family_name?: string;
}) => {
  // Ensure session is ready before INSERT to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase
    .from('family_invitation')
    .insert(payload);
};

export const updateInvitationStatus = async (invitationId: string, status: 'accepted' | 'rejected' | 'expired') => {
  // Ensure session is ready before UPDATE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase
    .from('family_invitation')
    .update({ status })
    .eq('id', invitationId);
};

export const deleteInvitation = async (invitationId: string) => {
  // Ensure session is ready before DELETE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase
    .from('family_invitation')
    .delete()
    .eq('id', invitationId);
};

// ============================================================================
// SYNC OPERATIONS (used by OnlineContext)
// ============================================================================

export const deleteByIdFromTable = async (table: string, id: string) => {
  // Ensure session is ready before DELETE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase.from(table).delete().eq('id', id);
};

export const insertToTable = async (table: string, data: any) => {
  // Ensure session is ready before INSERT to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase.from(table).insert(data);
};

export const updateInTable = async (table: string, id: string, data: any) => {
  // Ensure session is ready before UPDATE to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  return supabase.from(table).update(data).eq('id', id);
};

export const insertWithSelect = async (table: string, data: any) => {
  // Ensure session is ready before INSERT to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  // Use insert + select to get the inserted row back
  return supabase.from(table).insert(data).select().single();
};

// Note: Old expense/income/category features have been removed

export const insertEventForSync = async (data: any) => {
  // Ensure session is ready before INSERT to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  logger.apiCall('POST', 'event', { eventId: data.id, familyId: data.family_id });
  // Use insert + select to get the inserted row back
  const result = await supabase.from('event').insert(data).select().single();
  logger.apiResponse('POST', 'event', result.error ? 400 : 201, { eventId: result.data?.id });
  return result;
};

export const insertTagDefinitionForSync = async (data: { family_id: string; name: string; color: string }) => {
  // Ensure session is ready before INSERT to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  logger.apiCall('POST', 'tag', { familyId: data.family_id, name: data.name });
  // Use insert + select to get the inserted row back
  const result = await supabase.from('tag').insert(data).select().single();
  logger.apiResponse('POST', 'tag', result.error ? 400 : 201, { tagId: result.data?.id });
  return result;
};

export const insertEventTagForSync = async (data: { event_id: string; tag_id: string }) => {
  // Ensure session is ready before INSERT to prevent 403 RLS errors
  await userService.ensureSessionReady();
  
  logger.apiCall('POST', 'event_tag', { eventId: data.event_id, tagId: data.tag_id });
  // Use insert + select to get the inserted row back
  const result = await supabase.from('event_tag').insert(data).select().single();
  logger.apiResponse('POST', 'event_tag', result.error ? 400 : 201);
  return result;
};