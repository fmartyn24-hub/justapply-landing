import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

interface CareerComponent {
  id: string
  title: string
  type: string
}

function parseTitle(title: string): { jobTitle: string; organization: string | null } {
  // Pattern: "Job Title at Organization"
  if (title.includes(' at ')) {
    const [jobTitle, organization] = title.split(' at ').map((s) => s.trim())
    return { jobTitle, organization }
  }

  // Special case: EPSA and similar (President, etc.)
  // For now, if no " at " pattern, try other common patterns
  if (title.includes(' of ')) {
    // "President of European Parliament Stagiaires Association (EPSA)"
    // Keep as is for now - will be handled case by case
    return { jobTitle: title, organization: null }
  }

  return { jobTitle: title, organization: null }
}

async function migrateCareerComponents() {
  console.log('Starting career components migration...')

  try {
    // Fetch all experience-type career components
    const { data: components, error: fetchError } = await supabase
      .from('career_components')
      .select('id, title, type')
      .eq('type', 'experience')

    if (fetchError) {
      console.error('Error fetching career components:', fetchError)
      process.exit(1)
    }

    if (!components || components.length === 0) {
      console.log('No career components to migrate')
      process.exit(0)
    }

    console.log(`Found ${components.length} experience components to process`)

    let updated = 0
    let skipped = 0

    for (const component of components as CareerComponent[]) {
      const { jobTitle, organization } = parseTitle(component.title)

      // Only update if we found an organization to split out
      if (organization) {
        const { error: updateError } = await supabase
          .from('career_components')
          .update({
            title: jobTitle,
            organization_name: organization,
          })
          .eq('id', component.id)

        if (updateError) {
          console.error(`Error updating component ${component.id}:`, updateError)
        } else {
          updated++
          console.log(`✓ Updated: "${component.title}" → title: "${jobTitle}", org: "${organization}"`)
        }
      } else {
        skipped++
        console.log(`⊘ Skipped: "${component.title}" (no organization pattern found)`)
      }
    }

    console.log(`\nMigration complete: ${updated} updated, ${skipped} skipped`)
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateCareerComponents()
