// Deterministic (no AI, no API cost) matching of a job posting against the
// user's career library. Powers the free "how your library fits this job"
// preview: which components fit, which posting words they share, and which
// posting keywords nothing in the library covers yet.

export interface MatchableComponent {
  id: string
  type: string
  title: string
  organization_name?: string | null
  description?: string | null
  impact_metrics?: string | null
  tags?: string[] | null
  related_terms?: string | null
}

export type FitStrength = 'strong' | 'good' | 'some'

export interface ComponentMatch<T extends MatchableComponent = MatchableComponent> {
  component: T
  score: number
  strength: FitStrength
  // Posting words this component shares, most important first (as written in the posting).
  matchedWords: string[]
  // Stems of those words, for highlighting the component's own text.
  matchedStems: Set<string>
}

export interface PostingKeyword {
  word: string
  stem: string
  count: number
  covered: boolean
}

export interface FitResult<T extends MatchableComponent = MatchableComponent> {
  matches: ComponentMatch<T>[]
  keywords: PostingKeyword[]
}

// Generic English plus job-ad boilerplate that says nothing about the role.
const STOPWORDS = new Set(
  `a about above after again against all also am an and any are as at be because been before being below between
  both but by can could did do does doing down during each etc few for from further had has have having he her here
  hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on
  once only or other our ours ourselves out over own same she should so some such than that the their theirs them
  themselves then there these they this those through to too under until up very was we were what when where which
  while who whom why will with would you your yours yourself yourselves us via per within across around without
  ability able apply applicant applicants applying candidate candidates company opportunity opportunities role roles
  position positions job jobs team teams work working works experience experienced year years strong excellent
  good great looking join joining ideal ideally including include includes etc must required requirements require
  preferred plus bonus responsibilities responsible responsibility day days new well like make making help helping
  key based using use used across environment level skills skill knowledge understanding proven demonstrated
  benefits salary offer offering competitive what's we're you'll you're we'll it's who'll please send
  successful e.g i.e eg ie one two three four five within want need needs`
    .split(/\s+/)
    .filter(Boolean)
)

// Light stemming so "managed", "managing" and "manages" meet. Deliberately
// conservative: over-stemming produces confusing matches.
export function stem(word: string): string {
  let w = word
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3)
  else if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y'
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('es') && /(ss|x|ch|sh)es$/.test(w)) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  return w
}

interface Token {
  word: string
  stem: string
}

// Keeps things like "c++", "c#", "node.js" and "b2b" intact.
export function tokenize(text: string): Token[] {
  const out: Token[] = []
  for (const raw of (text || '').toLowerCase().split(/[^a-z0-9+#.À-ɏ]+/)) {
    const word = raw.replace(/^\.+|\.+$/g, '')
    if (word.length < 2 || STOPWORDS.has(word) || /^\d+$/.test(word)) continue
    out.push({ word, stem: stem(word) })
  }
  return out
}

function normalizePhrase(text: string): string {
  return tokenize(text)
    .map((t) => t.stem)
    .join(' ')
}

// Field weights: a hit in a title or tag says more than one buried in a description.
const FIELD_WEIGHTS: Array<[keyof MatchableComponent, number]> = [
  ['title', 3],
  ['tags', 3],
  ['impact_metrics', 1.5],
  ['description', 1],
  ['related_terms', 1],
  ['organization_name', 0.5],
]

// Voice/context components describe how to write, not what you've done.
const EXCLUDED_TYPES = new Set(['voice', 'context'])

function fieldText(c: MatchableComponent, field: keyof MatchableComponent): string {
  const v = c[field]
  if (Array.isArray(v)) return v.join(' , ')
  return typeof v === 'string' ? v : ''
}

export function matchComponentsToPosting<T extends MatchableComponent>(
  posting: string,
  components: T[],
  { maxKeywords = 18 }: { maxKeywords?: number } = {}
): FitResult<T> {
  const postingTokens = tokenize(posting)
  if (postingTokens.length === 0) return { matches: [], keywords: [] }

  // Posting term frequencies, remembering the first way each stem was written.
  const counts = new Map<string, number>()
  const surface = new Map<string, string>()
  const firstSeen = new Map<string, number>()
  postingTokens.forEach((t, i) => {
    counts.set(t.stem, (counts.get(t.stem) || 0) + 1)
    if (!surface.has(t.stem)) surface.set(t.stem, t.word)
    if (!firstSeen.has(t.stem)) firstSeen.set(t.stem, i)
  })
  const postingStemSeq = ` ${postingTokens.map((t) => t.stem).join(' ')} `

  const candidates = components.filter((c) => !EXCLUDED_TYPES.has(c.type))
  const libraryStems = new Set<string>()

  const matches: ComponentMatch<T>[] = []
  for (const component of candidates) {
    // Best field weight per stem for this component.
    const stemWeight = new Map<string, number>()
    for (const [field, weight] of FIELD_WEIGHTS) {
      for (const t of tokenize(fieldText(component, field))) {
        libraryStems.add(t.stem)
        if (weight > (stemWeight.get(t.stem) || 0)) stemWeight.set(t.stem, weight)
      }
    }

    const contributions: Array<{ stem: string; value: number }> = []
    stemWeight.forEach((weight, s) => {
      const c = counts.get(s)
      if (c) contributions.push({ stem: s, value: weight * (1 + Math.log(c)) })
    })

    // Multi-word tags that appear as a phrase in the posting ("stakeholder
    // management", "google analytics") are strong evidence.
    let phraseBonus = 0
    for (const tag of component.tags || []) {
      const phrase = normalizePhrase(tag)
      if (phrase.includes(' ') && postingStemSeq.includes(` ${phrase} `)) phraseBonus += 4
    }

    if (contributions.length === 0 && phraseBonus === 0) continue

    contributions.sort((a, b) => b.value - a.value)
    const score = contributions.reduce((sum, x) => sum + x.value, 0) + phraseBonus
    const distinct = contributions.length
    const strength: FitStrength =
      score >= 14 || distinct >= 5 || (phraseBonus > 0 && distinct >= 2)
        ? 'strong'
        : score >= 6 || distinct >= 2
          ? 'good'
          : 'some'

    matches.push({
      component,
      score,
      strength,
      matchedWords: contributions.map((x) => surface.get(x.stem) || x.stem),
      matchedStems: new Set(contributions.map((x) => x.stem)),
    })
  }
  matches.sort((a, b) => b.score - a.score)

  // The posting's most-repeated terms (earlier mentions break ties), and
  // whether anything in the library covers them.
  const keywords: PostingKeyword[] = Array.from(counts.entries())
    .filter(([s]) => s.length > 2)
    .sort((a, b) => b[1] - a[1] || (firstSeen.get(a[0])! - firstSeen.get(b[0])!))
    .slice(0, maxKeywords)
    .map(([s, count]) => ({ word: surface.get(s) || s, stem: s, count, covered: libraryStems.has(s) }))

  return { matches, keywords }
}

// Splits text into segments, flagging words whose stem is in `stems`, so the UI
// can highlight exactly why a component matched.
export function highlightSegments(text: string, stems: Set<string>): Array<{ text: string; hit: boolean }> {
  const parts = (text || '').split(/([A-Za-z0-9+#À-ɏ]+(?:\.[A-Za-z0-9]+)*)/)
  return parts
    .filter((p) => p !== '')
    .map((p) => {
      const lower = p.toLowerCase()
      return { text: p, hit: /[a-z0-9]/i.test(p) && !STOPWORDS.has(lower) && stems.has(stem(lower)) }
    })
}
