/**
 * Mapping between Supabase component types and app component types
 */

export const supabaseToAppType: Record<string, string> = {
  // Legacy extraction-era type names, collapsed into the current vocabulary.
  experience: 'role',
  tool: 'skill',
  campaign: 'project',
  // Passthrough for app types (in case they're already in app format)
  role: 'role',
  project: 'project',
  kpi: 'kpi',
  voice: 'voice',
  skill: 'skill',
  achievement: 'achievement',
  context: 'context',
  education: 'education',
  certification: 'certification',
  program: 'program',
  volunteer: 'volunteer',
}

export const appToSupabaseType: Record<string, string> = {
  skill: 'tool',
  role: 'experience',
  project: 'campaign',
  kpi: 'kpi',
  voice: 'voice',
  achievement: 'achievement',
  context: 'context',
  education: 'education',
  certification: 'certification',
  program: 'program',
  volunteer: 'volunteer',
}

/**
 * Normalize component type from database to app format
 */
export function normalizeComponentType(dbType: string): string {
  const normalized = supabaseToAppType[dbType.toLowerCase()] || dbType
  return normalized as string
}

/**
 * Normalize component type from app format to database format
 */
export function denormalizeComponentType(appType: string): string {
  return appToSupabaseType[appType.toLowerCase()] || appType
}
