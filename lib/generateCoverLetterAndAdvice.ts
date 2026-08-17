import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getToneOption, getLengthOption, type CoverLetterTone, type CoverLetterLength } from './coverLetterOptions'

export interface GenerationResult {
  coverLetter: string
  cvAdvice: string
  coverLetterStructured: any
}

export interface GenerationOptions {
  tone?: CoverLetterTone | null
  length?: CoverLetterLength | null
}

// Flattens the structured cover letter JSON into plain text for comparison
// purposes only (detecting whether a saved cover letter was hand-edited) —
// deliberately simpler than lib/previewHtml.ts's buildCoverLetterData, which
// is for rendering, not diffing.
function flattenStructuredCoverLetter(json: any): string {
  if (!json || typeof json !== 'object') return ''
  const parts = [
    json.opening || '',
    ...(Array.isArray(json.body_paragraphs) ? json.body_paragraphs : []),
    json.closing || '',
  ]
  return parts.filter(Boolean).join('\n\n').trim()
}

// Pulls a couple of the candidate's own past cover letters that they
// meaningfully hand-edited after generation (current text differs from the
// AI's original structured draft), so future generations can learn their
// actual voice/wording preferences instead of drifting back to generic
// phrasing every time — edits inform future drafts instead of staying
// siloed per application.
async function getEditedVoiceExamples(serverSupabase: SupabaseClient, userId: string, excludeApplicationId?: string | null) {
  let query = serverSupabase
    .from('applications')
    .select('id, generated_cover_letter, generated_cover_letter_json, updated_at')
    .eq('user_id', userId)
    .not('generated_cover_letter_json', 'is', null)
    .not('generated_cover_letter', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(15)

  if (excludeApplicationId) {
    query = query.neq('id', excludeApplicationId)
  }

  const { data } = await query
  if (!data) return []

  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()

  return data
    .filter((app: any) => {
      const original = normalize(flattenStructuredCoverLetter(app.generated_cover_letter_json))
      const current = normalize(app.generated_cover_letter || '')
      // Require a real, substantive edit — not just whitespace or a typo fix.
      return original && current && original !== current && Math.abs(original.length - current.length) > 15
    })
    .slice(0, 2)
    .map((app: any) => app.generated_cover_letter as string)
}

// Shared by the Just Apply wizard (generate-application.ts) and the on-demand
// "Generate" buttons in ApplicationPreview for manually-created applications.
// Produces a tailored cover letter plus advice on the candidate's OWN uploaded
// CV — this app does not write or design a CV document for them.
export async function generateCoverLetterAndAdvice(
  serverSupabase: SupabaseClient,
  userId: string,
  userEmail: string | undefined,
  jobDescription: string,
  jobTitle: string | undefined,
  company: string | undefined,
  selectedComponentIds: string[] | undefined,
  cvId?: string | null,
  options?: GenerationOptions,
  currentApplicationId?: string | null
): Promise<GenerationResult> {
  const highlightIds: string[] = Array.isArray(selectedComponentIds)
    ? selectedComponentIds.filter((id): id is string => typeof id === 'string')
    : []

  const { data: components, error: componentError } = await serverSupabase
    .from('career_components')
    .select('*')
    .eq('user_id', userId)

  if (componentError) throw componentError

  const { data: profileData } = await serverSupabase
    .from('user_profiles')
    .select('first_name, last_name, email, phone, address, based_in, open_to_relocation, relocation_locations, remote_preference, website, linkedin_url')
    .eq('id', userId)
    .maybeSingle()

  const { data: profileAnswers } = await serverSupabase
    .from('profile_answers')
    .select('answers')
    .eq('user_id', userId)
    .single()

  // Advice is grounded in a specific CV's actual text, not one we invent.
  // If the candidate picked a CV, use that one; otherwise fall back to the
  // most recently uploaded one (e.g. regeneration on an older application
  // that predates the CV picker).
  const cvQuery = serverSupabase
    .from('cvs')
    .select('extracted_text, filename, created_at')
    .eq('user_id', userId)
    .eq('document_type', 'cv')

  const { data: selectedCv } = cvId
    ? await cvQuery.eq('id', cvId).maybeSingle()
    : await cvQuery.order('created_at', { ascending: false }).limit(1).maybeSingle()

  const latestCv = selectedCv

  const toneOption = getToneOption(options?.tone)
  const lengthOption = getLengthOption(options?.length)
  const voiceExamples = await getEditedVoiceExamples(serverSupabase, userId, currentApplicationId)
  const voiceExamplesSection = voiceExamples.length > 0
    ? `

## THIS CANDIDATE'S OWN VOICE — examples of past cover letters they hand-edited after generation
These are drafts THIS candidate personally rewrote — study their actual wording choices, sentence rhythm, and phrasing preferences and lean toward that demonstrated style over generic phrasing. Do NOT reuse their content; these are for a different job.
${voiceExamples.map((text, i) => `### Edited example ${i + 1}\n${text}`).join('\n\n')}
`
    : ''

  const roles = (components || []).filter((c: any) => c.type === 'experience' || c.type === 'role')
  const skills = (components || []).filter((c: any) => c.type === 'tool' || c.type === 'skill')
  const achievements = (components || []).filter((c: any) => c.type === 'campaign' || c.type === 'achievement')
  const projects = (components || []).filter((c: any) => c.type === 'project')
  const voice = (components || []).filter((c: any) => c.type === 'voice')

  const highlighted = highlightIds.length > 0
    ? (components || []).filter((c: any) => highlightIds.includes(c.id))
    : []
  const highlightedSection = highlighted.length > 0
    ? `

## PRIORITISED COMPONENTS — the candidate has explicitly chosen to emphasise these for THIS application
Give these the most prominent placement in the cover letter's argument, and call them out first in CV advice where relevant:
${highlighted.map((c: any) => `- (${c.type}) ${c.title}${c.organization_name ? ` @ ${c.organization_name}` : ''}: ${c.description || ''}${c.impact_metrics ? ` (${c.impact_metrics})` : ''}`).join('\n')}
`
    : ''

  const careerContext = `
## User Profile
Name: ${profileData?.first_name || ''} ${profileData?.last_name || ''}
Email: ${profileData?.email || userEmail || ''}
Phone: ${profileData?.phone || ''}
Based in: ${profileData?.based_in || profileData?.address || ''}
${profileData?.open_to_relocation ? `Open to relocation: Yes${profileData?.relocation_locations ? ` — willing to relocate to ${profileData.relocation_locations}` : ''}${profileData?.remote_preference ? ` (work-location preference: ${profileData.remote_preference})` : ''}` : 'Open to relocation: No'}
${profileData?.website ? `Portfolio/Website: ${profileData.website}` : ''}
${profileData?.linkedin_url ? `LinkedIn: ${profileData.linkedin_url}` : ''}

IMPORTANT — Location rules:
- Use ONLY the "Based in" value above for the candidate's location. Do NOT infer or invent a location from job descriptions, employers, or career history.
- If the candidate is open to relocation and the target role is in a different location, you may naturally signal that openness in the cover letter.

## Career Components

### Roles & Experience
${roles.length > 0 ? roles.map((r: any) => `- ${r.title}${r.organization_name ? ` at ${r.organization_name}` : ''}${r.start_date ? ` (${r.start_date} - ${r.end_date || 'Present'})` : ''}: ${r.description || ''}`).join('\n') : 'No roles provided'}

### Skills & Technologies
${skills.length > 0 ? skills.map((s: any) => `- ${s.title}: ${s.description || ''}`).join('\n') : 'No skills provided'}

### Achievements
${achievements.length > 0 ? achievements.map((a: any) => `- ${a.title}: ${a.description || ''} ${a.impact_metrics ? `(${a.impact_metrics})` : ''}`).join('\n') : 'No achievements provided'}

### Projects
${projects.length > 0 ? projects.map((p: any) => `- ${p.title}: ${p.description || ''} ${p.tags?.length ? `[${p.tags.join(', ')}]` : ''}`).join('\n') : 'No projects provided'}

### Personal Voice & Values
${voice.length > 0 ? voice.map((v: any) => `${v.description || ''}`).join('\n') : 'No voice/values provided'}

${profileAnswers?.answers ? `
### Profile Enrichment Answers
${JSON.stringify(profileAnswers.answers, null, 2)}
` : ''}
${highlightedSection}
${voiceExamplesSection}
## Candidate's Most Recently Uploaded CV/Resume (the actual document they currently use)
${latestCv?.extracted_text
  ? `File: ${latestCv.filename}\n\n${latestCv.extracted_text}`
  : 'No CV has been uploaded yet — give general advice based on the career components above instead of referencing a specific document.'}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are a world-class career strategist with 20+ years of experience placing candidates at top-tier companies. You combine the analytical rigor of a McKinsey consultant, the storytelling craft of a long-form journalist, and the persuasive instincts of a top recruiter.

Your task has two parts for this specific candidate applying to this specific role:

1. Write a genuinely excellent, bespoke cover letter — not a generic template.
2. Give the candidate direct, specific advice on how to adjust their EXISTING CV/resume (provided below) for this application. You are NOT writing or redesigning their CV — you are advising a human on what to change, as a sharp friend who's read their CV and this job description side by side would.

═══════════════════════════════════════════════
INPUTS
═══════════════════════════════════════════════
Job Position: ${jobTitle || 'Position'}
Company: ${company || 'Company'}
Job Description:
${jobDescription}

Candidate's Career Context (achievements, roles, skills, voice, values) and their current CV/resume text:
${careerContext}

═══════════════════════════════════════════════
PHASE 1 — STRATEGIC ANALYSIS (do this silently before writing)
═══════════════════════════════════════════════
Before generating a single word of output, work through the following analysis internally. Do not include this analysis in your response — it shapes the writing but is not visible to the reader.

1. **Decode the job description.** Identify the 3–5 must-have competencies, 2–3 nice-to-have signals, the implicit problem this role exists to solve, the seniority level, and cultural/tonal signals.
2. **Inventory the candidate.** Identify the strongest achievements for this role, skills that map directly to requirements, distinctive proof points, the candidate's voice (formal/conversational, UK/US English), and any stated values.
3. **Identify the match thesis.** One sentence (kept internal): why is this candidate uniquely well-suited to this role?
4. **Compare their existing CV against that thesis and this JD.** What's missing, buried, generic, or misaligned? Never invent facts, numbers, or experience not present in the career context or CV.

═══════════════════════════════════════════════
PHASE 2 — WRITING THE COVER LETTER
═══════════════════════════════════════════════
A cover letter is not a prose version of the CV. It is a focused argument for why this candidate is the right hire — written in their voice, addressed to a human.

**Structure:**
- Opening (1 short paragraph): a specific, earned hook. Not "I am writing to apply for..." Reference something specific about the company or role that signals real research.
- Body (2 paragraphs only): the match thesis in action. Pick the 2 strongest accomplishments and connect each explicitly to a need in the JD. Tell mini-stories with stakes and outcomes.
- Close (1 short paragraph): forward-looking, specific to what they could contribute, warm but not saccharine.

**Voice and tone:**
- Requested tone for this draft: ${toneOption.promptInstruction}
- Write in the candidate's voice as inferred from their career context (and their own past edited drafts, if provided below) filtered through that requested tone. Confident but not arrogant.
- Avoid every cover-letter cliché: "I am excited to apply," "I believe I would be a great fit," "synergy," "dynamic team player," "wear many hats," "hit the ground running," "passionate about."
- No bullet points — it should read as considered prose.
- **Strict length: ${lengthOption.wordRange} total across opening + body + closing. This MUST fit on a single printed page with normal margins — err toward the shorter end rather than long.**

**Personalization signals:**
- Reference the company by name in a way that demonstrates real understanding, drawn from the JD itself
- Reflect any stated values from the candidate's career context

═══════════════════════════════════════════════
PHASE 3 — CV/RESUME ADVICE (not a rewritten CV)
═══════════════════════════════════════════════
Give 4–7 specific, actionable suggestions for adjusting their EXISTING CV for this specific application. Each suggestion should name the concrete change, not a vague principle. Examples of the right level of specificity:
- "Move your Acme Corp role above Beta Inc — it's more relevant to this JD's emphasis on B2B sales, and it's currently buried on page 2."
- "Your summary doesn't mention budget ownership at all, but this JD lists it as a must-have and you managed a $2M budget at Acme — add one line."
- "Cut the 'Proficient in Microsoft Office' bullet — it's noise for a role at this seniority level."

If no CV was uploaded, give advice based on the career components instead, framed as "when you add your CV, prioritise..." guidance grounded in what's missing from their component library relative to this JD.

Never invent facts, dates, employers, or numbers not present in the provided CV text or career components.

═══════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════
Respond with valid JSON only — no preamble, no commentary, no markdown code fences, no trailing text. The JSON must have this structure:

{
  "coverLetter": {
    "opening": "Engaging opening paragraph",
    "body_paragraphs": ["Paragraph 1", "Paragraph 2"],
    "closing": "Professional closing paragraph"
  },
  "cvAdvice": {
    "summary": "One sentence on the overall fit and the biggest lever to pull",
    "suggestions": [
      {"area": "Short label e.g. 'Professional Summary' or 'Acme Corp role'", "advice": "The specific, actionable change"}
    ]
  }
}

All text fields must be plain text with newlines escaped as \\n where needed. Ensure all JSON is valid and properly escaped.`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  let coverLetter = ''
  let cvAdvice = ''
  let coverLetterStructured: any = null

  function extractJson(text: string): any {
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7)
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3)
    }
    return JSON.parse(jsonText.trim())
  }

  function applyParsed(parsed: any) {
    if (typeof parsed.coverLetter === 'object' && parsed.coverLetter !== null) {
      coverLetterStructured = parsed.coverLetter
      coverLetter = convertStructuredCoverLetterToPlainText(parsed.coverLetter)
    } else if (typeof parsed.coverLetter === 'string') {
      coverLetter = parsed.coverLetter
    } else {
      throw new Error('Cover letter is missing or invalid')
    }

    if (typeof parsed.cvAdvice === 'object' && parsed.cvAdvice !== null) {
      cvAdvice = convertCvAdviceToPlainText(parsed.cvAdvice)
    } else if (typeof parsed.cvAdvice === 'string') {
      cvAdvice = parsed.cvAdvice
    } else {
      throw new Error('CV advice is missing or invalid')
    }
  }

  try {
    applyParsed(extractJson(content.text))
  } catch (firstError) {
    // The response was truncated or malformed. Ask Claude to repair its own
    // output into valid JSON once before giving up.
    try {
      const repairResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `The following was supposed to be valid JSON matching a cover-letter/CV-advice schema but failed to parse (error: ${
              firstError instanceof Error ? firstError.message : String(firstError)
            }). Fix it and return ONLY the corrected, valid JSON — no preamble, no commentary, no markdown code fences, no trailing text. Preserve all the original content; only fix structural/syntax issues (unescaped characters, truncation, trailing commas, etc.):\n\n${content.text}`,
          },
        ],
      })
      const repairContent = repairResponse.content[0]
      if (repairContent.type !== 'text') {
        throw new Error('Unexpected response type from Claude during repair')
      }
      applyParsed(extractJson(repairContent.text))
    } catch (repairError) {
      throw new Error(
        'Failed to parse JSON response from Claude, and repair attempt also failed. Response was: ' +
          content.text.substring(0, 200)
      )
    }
  }

  if (!coverLetter || !cvAdvice) {
    throw new Error('Cover letter or CV advice is empty in the response')
  }

  return { coverLetter, cvAdvice, coverLetterStructured }
}

function convertStructuredCoverLetterToPlainText(clData: any): string {
  const lines: string[] = []

  if (clData.opening) {
    lines.push(clData.opening)
    lines.push('')
  }

  if (clData.body_paragraphs && Array.isArray(clData.body_paragraphs)) {
    clData.body_paragraphs.forEach((paragraph: string) => {
      lines.push(paragraph)
      lines.push('')
    })
  }

  if (clData.closing) {
    lines.push(clData.closing)
  }

  return lines.join('\n').trim()
}

function convertCvAdviceToPlainText(advice: any): string {
  const lines: string[] = []

  if (advice.summary) {
    lines.push(advice.summary)
    lines.push('')
  }

  if (advice.suggestions && Array.isArray(advice.suggestions)) {
    advice.suggestions.forEach((s: any) => {
      if (s.area && s.advice) {
        lines.push(`${s.area}: ${s.advice}`)
      } else if (s.advice) {
        lines.push(s.advice)
      }
    })
  }

  return lines.join('\n').trim()
}
