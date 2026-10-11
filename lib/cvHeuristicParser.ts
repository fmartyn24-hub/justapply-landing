// Rule-based (no AI) CV parser for the free tier. Turns CV text into draft
// career components — roles, education, skills, certifications, projects,
// volunteering, plus achievements pulled from bullets that contain numbers —
// for the user to check in the normal review screen. It won't be as good as
// the AI import, but a 60%-right draft beats typing a career history by hand.

export interface ParsedComponent {
  type: 'role' | 'education' | 'skill' | 'certification' | 'project' | 'volunteer' | 'achievement'
  title: string
  organization_name: string | null
  start_date: string | null
  end_date: string | null
  primary_location: string | null
  description: string | null
  impact_metrics: string | null
  tags: string[]
}

type SectionKind = 'experience' | 'education' | 'skills' | 'projects' | 'volunteer' | 'certifications' | 'other'

const SECTION_PATTERNS: Array<[SectionKind, RegExp]> = [
  ['experience', /^((work|professional|relevant|employment|career|industry)\s+)?(experience|history|employment)(\s+history)?$|^employment$|^work$|^career$/],
  ['education', /^(education|academic (background|history|qualifications)|qualifications|education (and|&) (training|qualifications))$/],
  ['skills', /^((key|technical|core|professional|relevant|other)\s+)?(skills|competencies|expertise)(\s*(and|&)\s*(tools|technologies|interests|languages))?$|^(tools|technologies|tech stack|tools (and|&) technologies)$/],
  ['projects', /^((selected|personal|key|academic|side)\s+)?projects$/],
  ['volunteer', /^(volunteer(ing)?( experience| work)?|community( involvement)?|extracurricular( activities)?|leadership( (and|&) activities)?|activities)$/],
  ['certifications', /^(certifications?|certificates|licen[cs]es?( (and|&) certifications)?|courses|training|professional development)$/],
  ['other', /^(summary|profile|professional summary|personal statement|about( me)?|objective|languages|interests|hobbies|references|awards|honou?rs|publications|contact( details)?|personal details|achievements)$/],
]

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}
const MONTH = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
const DATE = `(?:${MONTH}\\.?\\s*'?\\d{2,4}|\\d{1,2}\\s*[/.]\\s*\\d{4}|(?:19|20)\\d{2})`
const END = `(?:${DATE}|present|current|now|today|ongoing|date)`
const RANGE_RE = new RegExp(`(${DATE})\\s*(?:-|–|—|to|until|till|→)\\s*(${END})`, 'i')
const SINGLE_YEAR_RE = /\b((?:19|20)\d{2})\b/

const BULLET_RE = /^\s*(?:[-–—•·▪●◦*>]|\d{1,2}[.)])\s+/
const METRIC_RE = /(\d[\d,.]*\s*(%|percent|k\b|m\b|bn\b|x\b|million|billion|thousand))|([€$£]\s*\d)|(\d+\s*(users|customers|clients|people|students|members|subscribers|downloads|sales|leads|projects|countries|markets|hours|days|weeks))/i

const TITLE_WORDS = /\b(manager|engineer|developer|coordinator|analyst|intern|internship|assistant|director|lead|head|officer|consultant|designer|associate|specialist|executive|administrator|teacher|tutor|researcher|scientist|founder|co-founder|owner|representative|advisor|adviser|architect|supervisor|technician|nurse|accountant|editor|writer|producer|strategist|programmer|president|vice|chief|partner|trainee|apprentice|volunteer|ambassador|mentor|organiser|organizer|cashier|barista|server|waiter|waitress|clerk|agent|planner|buyer|recruiter|operator|chair|secretary|treasurer)\b/i
const ORG_WORDS = /\b(ltd|limited|inc|gmbh|llc|plc|corp|corporation|company|co\.|group|agency|bank|university|college|school|institute|foundation|association|council|ministry|commission|hospital|s\.a\.|sa|bv|ag|nv|sarl|srl|ngo|studio|labs?)\b/i
const DEGREE_WORDS = /\b(bachelor|master|b\.?sc|b\.?a\.?|m\.?sc|m\.?a\.?|mba|ph\.?d|doctorate|diploma|degree|certificate|a[- ]levels?|gcse|baccalaur|licen[cs]e|licenciatura|abitur|bachelier|hnd|btec|associate)\b/i
const INSTITUTION_WORDS = /\b(university|universit|college|school|institute|academy|polytechnic|hochschule|école|ecole|lycée|gymnasium|faculty)\b/i
const LOCATION_RE = /^(remote|hybrid|on-?site|[A-Z][\p{L}.' -]{1,30},\s*[A-Z][\p{L}.' -]{1,30})$/u

function normalizeHeading(line: string): string {
  return line
    .toLowerCase()
    .replace(/[^a-z& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sectionOf(line: string): SectionKind | null {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > 45 || /[.!?]$/.test(trimmed)) return null
  const h = normalizeHeading(trimmed)
  if (!h) return null
  for (const [kind, re] of SECTION_PATTERNS) if (re.test(h)) return kind
  return null
}

function toIsoDate(raw: string): string | null {
  const s = raw.trim().toLowerCase()
  if (/^(present|current|now|today|ongoing|date)$/.test(s)) return null
  const mm = s.match(/^(\d{1,2})\s*[/.]\s*(\d{4})$/)
  if (mm) return `${mm[2]}-${mm[1].padStart(2, '0')}-01`
  const named = s.match(new RegExp(`^(${MONTH})\\.?\\s*'?(\\d{2,4})$`, 'i'))
  if (named) {
    const month = MONTHS[named[1].slice(0, named[1].startsWith('sept') ? 4 : 3)] || 1
    let year = named[2]
    if (year.length === 2) year = (parseInt(year, 10) > 50 ? '19' : '20') + year
    return `${year}-${String(month).padStart(2, '0')}-01`
  }
  const y = s.match(/^((?:19|20)\d{2})$/)
  if (y) return `${y[1]}-01-01`
  return null
}

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, '').trim()
}

function isBullet(line: string): boolean {
  return BULLET_RE.test(line)
}

// Splits a header like "Marketing Coordinator | Northwind | London, UK" or
// "Northwind — Marketing Coordinator" or "Marketing Coordinator at Northwind".
function splitHeader(text: string): string[] {
  const cleaned = text
    .replace(/\bsince\s+\S+/i, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/\s+at\s+/i, ' | ')
    .replace(/\s*[|•·–—]\s*|\s+-\s+|\t|\s{3,}/g, ' | ')
  return cleaned
    .split(' | ')
    .map((p) => p.replace(/\s{2,}/g, ' ').replace(/^[\s,;:]+|[\s,;:]+$/g, '').trim())
    .filter((p) => p.length > 0)
    .flatMap(splitTitleComma)
}

// "BA Communications, University of Leeds" / "Treasurer, Student Radio Society"
// are two fields; "London, UK" is one.
function splitTitleComma(part: string): string[] {
  const m = part.match(/^([^,]+),\s*([^,]+)$/)
  if (!m) return [part]
  const [, left, right] = m
  const leftIsTitle = TITLE_WORDS.test(left) || DEGREE_WORDS.test(left)
  const rightIsOrg = ORG_WORDS.test(right) || INSTITUTION_WORDS.test(right) || /\b(society|club|team|union|network|charity|trust)\b/i.test(right)
  return leftIsTitle || rightIsOrg ? [left.trim(), right.trim()] : [part]
}

interface HeaderFields {
  title: string
  organization: string | null
  location: string | null
}

function assignHeader(parts: string[], kind: 'role' | 'education' | 'other'): HeaderFields | null {
  const rest: string[] = []
  let location: string | null = null
  for (const p of parts) {
    if (!location && LOCATION_RE.test(p) && !TITLE_WORDS.test(p) && !ORG_WORDS.test(p)) location = p
    else rest.push(p)
  }
  // "Northwind, London" looks like a location, but if it's all we have besides
  // the title it's really "organization, city".
  if (rest.length === 1 && location && location.includes(',') && !/^(remote|hybrid|on-?site)$/i.test(location)) {
    const [org, ...place] = location.split(',')
    rest.push(org.trim())
    location = place.join(',').trim() || null
  }
  if (rest.length === 0) return null

  const isTitle = kind === 'education' ? (p: string) => DEGREE_WORDS.test(p) : (p: string) => TITLE_WORDS.test(p)
  const isOrg = kind === 'education' ? (p: string) => INSTITUTION_WORDS.test(p) : (p: string) => ORG_WORDS.test(p)

  let title = rest[0]
  let organization: string | null = rest[1] || null
  if (rest.length >= 2 && ((!isTitle(rest[0]) && isTitle(rest[1])) || (isOrg(rest[0]) && !isOrg(rest[1])))) {
    title = rest[1]
    organization = rest[0]
  }
  // "London, UK" can arrive as a trailing extra part.
  if (!location && rest[2] && rest[2].length < 40) location = rest[2]

  return { title: title.slice(0, 140), organization: organization ? organization.slice(0, 140) : null, location }
}

function metricBullets(body: string[]): string[] {
  return body.filter((l) => METRIC_RE.test(l) && l.length >= 15).slice(0, 3)
}

// Parses a section of dated entries (experience, education, volunteering,
// dated projects). An entry starts at a line with a date range; up to two
// short, non-bullet lines right above it belong to its header.
function parseDatedEntries(lines: string[], kind: 'role' | 'education' | 'volunteer' | 'project'): ParsedComponent[] {
  const dated: number[] = []
  lines.forEach((l, i) => {
    if (RANGE_RE.test(l) || (kind === 'education' && SINGLE_YEAR_RE.test(l) && l.length < 80)) dated.push(i)
  })
  if (dated.length === 0) return []

  // Where each entry's header begins. If the dated line already carries the
  // title/organization ("Acme — Engineer  03/2020 – present"), it IS the
  // header; otherwise up to two short lines above it are.
  const starts = dated.map((d, k) => {
    const remainder = lines[d].replace(RANGE_RE, ' ').replace(SINGLE_YEAR_RE, ' ')
    const hasText = remainder.replace(/[^\p{L}]+/gu, '').length >= 4
    const hasTitle = kind === 'education' ? DEGREE_WORDS.test(remainder) : TITLE_WORDS.test(remainder)
    if (hasText && hasTitle) return d
    const maxAbove = hasText ? 1 : 2
    const floor = k === 0 ? 0 : dated[k - 1] + 1
    let s = d
    while (s - 1 >= floor && d - (s - 1) <= maxAbove && !isBullet(lines[s - 1]) && lines[s - 1].length < 90) s--
    return s
  })

  const out: ParsedComponent[] = []
  dated.forEach((d, k) => {
    const headerLines = lines.slice(starts[k], d + 1)
    const bodyEnd = k + 1 < dated.length ? starts[k + 1] : lines.length
    const body = lines.slice(d + 1, bodyEnd).map(stripBullet).filter(Boolean)

    const dateLine = lines[d]
    const range = dateLine.match(RANGE_RE)
    let start: string | null = null
    let end: string | null = null
    if (range) {
      start = toIsoDate(range[1])
      end = toIsoDate(range[2])
    } else {
      const y = dateLine.match(SINGLE_YEAR_RE)
      if (y) end = `${y[1]}-01-01`
    }

    const headerText = headerLines
      .map((l, i) => (i === headerLines.length - 1 ? l.replace(range ? range[0] : SINGLE_YEAR_RE, ' ') : l))
      .map(stripBullet)
      .join(' | ')
    const fields = assignHeader(splitHeader(headerText), kind === 'education' ? 'education' : kind === 'role' ? 'role' : 'other')
    if (!fields || fields.title.length < 2) return

    const metrics = metricBullets(body)
    out.push({
      type: kind,
      title: fields.title,
      organization_name: fields.organization,
      start_date: start,
      end_date: end,
      primary_location: fields.location,
      description: body.length ? body.join('\n').slice(0, 2000) : null,
      impact_metrics: metrics[0] || null,
      tags: [],
    })

    // Bullets with numbers are achievements worth having as their own blocks.
    if (kind === 'role' || kind === 'volunteer') {
      for (const m of metrics) {
        out.push({
          type: 'achievement',
          title: m.length > 110 ? m.slice(0, 107).replace(/\s+\S*$/, '') + '…' : m,
          organization_name: fields.organization,
          start_date: null,
          end_date: null,
          primary_location: null,
          description: m,
          impact_metrics: m,
          tags: [],
        })
      }
    }
  })
  return out
}

// Undated entries (projects, certifications): a short non-bullet line is a
// title, and the bullets/long lines under it are its description.
function parseUndatedEntries(lines: string[], kind: 'project' | 'certification'): ParsedComponent[] {
  const out: ParsedComponent[] = []
  let current: ParsedComponent | null = null
  for (const line of lines) {
    const isHeader = !isBullet(line) && line.length < 90
    if (isHeader || (kind === 'certification' && isBullet(line))) {
      const year = line.match(SINGLE_YEAR_RE)
      const parts = splitHeader(stripBullet(line).replace(SINGLE_YEAR_RE, ' '))
      if (parts.length === 0) continue
      current = {
        type: kind,
        title: parts[0].slice(0, 140),
        organization_name: parts[1] || null,
        start_date: year ? `${year[1]}-01-01` : null,
        end_date: null,
        primary_location: null,
        description: null,
        impact_metrics: null,
        tags: [],
      }
      out.push(current)
    } else if (current) {
      const text = stripBullet(line)
      current.description = current.description ? `${current.description}\n${text}` : text
      if (!current.impact_metrics && METRIC_RE.test(text)) current.impact_metrics = text
    }
  }
  return out
}

function parseSkills(lines: string[]): ParsedComponent[] {
  const seen = new Set<string>()
  const out: ParsedComponent[] = []
  for (const raw of lines) {
    let line = stripBullet(raw)
    let category: string | null = null
    const colon = line.match(/^([^:]{2,30}):\s*(.+)$/)
    if (colon) {
      category = colon[1].trim()
      line = colon[2]
    }
    for (const piece of line.split(/\s*[,;|•·]\s*|\s+\/\s+/)) {
      const skill = piece.replace(/\(.*?\)/g, '').replace(/[.]$/, '').trim()
      const words = skill.split(/\s+/).length
      if (skill.length < 2 || skill.length > 40 || words > 4) continue
      const key = skill.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        type: 'skill',
        title: skill,
        organization_name: null,
        start_date: null,
        end_date: null,
        primary_location: null,
        description: null,
        impact_metrics: null,
        tags: category ? [category] : [],
      })
      if (out.length >= 25) return out
    }
  }
  return out
}

export function parseCvText(text: string): ParsedComponent[] {
  const lines = (text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim().length > 0)
    .map((l) => l.trim())

  // Group lines under their section headings.
  const sections: Array<{ kind: SectionKind | 'preamble'; lines: string[] }> = [{ kind: 'preamble', lines: [] }]
  for (const line of lines) {
    const kind = sectionOf(line)
    if (kind) sections.push({ kind, lines: [] })
    else sections[sections.length - 1].lines.push(line)
  }

  const out: ParsedComponent[] = []
  const hasExperienceHeading = sections.some((s) => s.kind === 'experience')
  for (const section of sections) {
    switch (section.kind) {
      case 'experience':
        out.push(...parseDatedEntries(section.lines, 'role'))
        break
      case 'education':
        out.push(...parseDatedEntries(section.lines, 'education'))
        break
      case 'volunteer':
        out.push(...parseDatedEntries(section.lines, 'volunteer'))
        break
      case 'projects': {
        const dated = parseDatedEntries(section.lines, 'project')
        out.push(...(dated.length ? dated : parseUndatedEntries(section.lines, 'project')))
        break
      }
      case 'certifications':
        out.push(...parseUndatedEntries(section.lines, 'certification'))
        break
      case 'skills':
        out.push(...parseSkills(section.lines))
        break
      case 'preamble':
        // No headings at all: fall back to any dated lines as roles.
        if (!hasExperienceHeading && sections.length === 1) out.push(...parseDatedEntries(section.lines, 'role'))
        break
    }
  }
  return out
}
