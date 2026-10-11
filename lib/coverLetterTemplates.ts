// Starter cover letters for the free tier, one per situation. [Square
// brackets] mark what the user still has to write; proof points are filled
// from the library components that best fit the job (see componentMatch).
// No dashes anywhere: cover letters in this app are kept dash-free.

export type CoverLetterTemplateId = 'experienced' | 'graduate' | 'career_switch' | 'internal'

export interface CoverLetterTemplate {
  id: CoverLetterTemplateId
  label: string
  description: string
}

export const COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
  { id: 'experienced', label: 'Experienced', description: 'You have done this kind of work before' },
  { id: 'graduate', label: 'Student or graduate', description: 'Lead with projects, studies and potential' },
  { id: 'career_switch', label: 'Career switch', description: 'Show how your experience transfers' },
  { id: 'internal', label: 'Internal move', description: 'A new role at your current employer' },
]

interface TemplateInput {
  jobTitle?: string
  company?: string
  name?: string
  // Short factual lines for the user's best-fit components, most relevant first.
  proofPoints?: string[]
}

function proof(points: string[] | undefined, i: number, fallback: string): string {
  return points && points[i] ? `${points[i]}. [Say what you did and what changed because of it.]` : fallback
}

export function buildCoverLetter(id: CoverLetterTemplateId, input: TemplateInput): string {
  const role = input.jobTitle || '[job title]'
  const company = input.company || '[company]'
  const sign = input.name || '[Your name]'
  const p = input.proofPoints

  const bodies: Record<CoverLetterTemplateId, string> = {
    experienced: `I am applying for the ${role} role at ${company}. [One sentence on why this company: something specific you admire about its work, product or mission.]

${proof(p, 0, '[Your strongest proof point: a result from a similar role, with a number if you have one.]')}

${proof(p, 1, '[A second proof point that matches another requirement in the job description.]')}

[Why now: what you want to do next, and how this role is the natural next step.]

I would welcome the chance to talk about how I could help ${company}. Thank you for your time.`,

    graduate: `I am applying for the ${role} role at ${company}. [What drew you to this company, as specifically as you can.]

[Your studies in one or two sentences, focused on what is relevant to this role.]

${proof(p, 0, '[A project, internship or society role that shows a skill they ask for, and what came of it.]')}

${proof(p, 1, '[Another example that shows how you work: teamwork, initiative, or learning something fast.]')}

I am keen to learn and to contribute from day one, and I would love the chance to discuss the role. Thank you for considering my application.`,

    career_switch: `I am applying for the ${role} role at ${company}. [Why you are moving into this field, and why with this company.]

In my current work as [current role] I have built skills that carry straight across.

${proof(p, 0, '[A transferable result: name the skill the job asks for, then the example that proves it.]')}

${proof(p, 1, '[A second transferable example.]')}

[What you have done to prepare for the switch: a course, a side project, volunteering.]

I would welcome the chance to show how my background could bring a fresh perspective to ${company}. Thank you for your time.`,

    internal: `I would like to be considered for the ${role} role. [Why this move, and why now.]

Since joining ${company} as [current role] I have [your main contribution so far].

${proof(p, 0, '[A result the hiring manager may already know about, tied to what the new role needs.]')}

${proof(p, 1, '[Another relevant example, ideally involving the team you would join.]')}

I know how we work and who we serve, so I could make progress quickly. I would be glad to talk it through.`,
  }

  return `Dear Hiring Manager,

${bodies[id]}

Kind regards,
${sign}`
}
