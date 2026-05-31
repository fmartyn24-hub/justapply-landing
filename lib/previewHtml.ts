// Shared HTML builder for document previews and server-side PDF rendering.
//
// Both the in-browser preview (`pages/preview.tsx`) and the headless-Chrome PDF
// endpoint (`pages/api/applications/export-pdf-html.ts`) must render the EXACT
// same markup so that what the user sees is what they download. This module is
// the single source of truth: it picks the right template generator, structures
// the CV / cover-letter data, and injects the print-override styles.

import { convertPlainTextCvToStructured } from '@/lib/exportConverters'
import { generateModernHtml } from '@/lib/templates/modernHtml'
import { generateProfessionalHtml } from '@/lib/templates/professionalHtml'
import { generateMinimalistHtml } from '@/lib/templates/minimalistHtml'
import { generateCreativeHtml } from '@/lib/templates/creativeHtml'
import { generateAcademicHtml } from '@/lib/templates/academicHtml'
import { generateExecutiveHtml } from '@/lib/templates/executiveHtml'
import { generateAtsHtml } from '@/lib/templates/atsHtml'

export const templateGenerators: { [key: string]: Function } = {
  modern: generateModernHtml,
  professional: generateProfessionalHtml,
  minimalist: generateMinimalistHtml,
  creative: generateCreativeHtml,
  academic: generateAcademicHtml,
  executive: generateExecutiveHtml,
  ats: generateAtsHtml,
}

// Override styles injected into the rendered document so that fixed-height,
// overflow:hidden template containers can grow and flow across multiple pages.
// Without this, templates designed as a single 8.5x11in page clip extra content.
export const OVERRIDE_STYLES = `
  <style id="preview-overrides">
    html, body {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .container {
      height: auto !important;
      min-height: 11in;
      max-height: none !important;
      overflow: visible !important;
      box-shadow: none !important;
      margin: 0 auto !important;
    }
    .content {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
    }

    /* Print rules: produce a multi-page PDF that matches the on-screen design.
       The browser's print engine renders the real HTML/CSS (colors, gradients,
       layout) and paginates natively, so the PDF looks exactly like the preview. */
    @media print {
      /* Force background colors/gradients to print (otherwise headers print white) */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        size: letter;
        margin: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .container {
        width: 100% !important;
        min-height: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
      }
      /* Keep section headings glued to the content that follows them, so a
         heading is never stranded alone at the bottom of a page. */
      .section-title, .section-header {
        break-after: avoid;
        page-break-after: avoid;
      }
      /* Keep an entry's title/subtitle/meta rows attached to their body so a
         job title is never orphaned at the bottom of a page. */
      .entry-title, .entry-subtitle, .entry-meta,
      .job-title, .job-header, .job-meta {
        break-after: avoid;
        page-break-after: avoid;
      }
      /* Keep genuinely small, atomic blocks from being sliced across a page
         break. NOTE: .entry/.job are deliberately NOT listed here — a tall,
         multi-bullet experience entry must be allowed to flow across a page
         boundary. Forcing the whole entry to stay together pushes a long first
         job onto the next page and leaves a large empty gap above it, which
         inflates the document by an extra page. */
      .skill-item, .skill-group, .education-item, .sidebar-section, .header {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
`

// Inject the override styles right before </head> (or prepend if no head)
export function buildDocument(html: string): string {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, OVERRIDE_STYLES + '</head>')
  }
  return OVERRIDE_STYLES + html
}

export interface ProfileLike {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

// Build the cover-letter data block, preferring the structured JSON stored at
// generation time and falling back to splitting stored plain text into paragraphs.
// `contact` (the paired CV header) and `date`/`recipient` are injected so each
// template can render a proper, branded letterhead and signature.
export function buildCoverLetterData(application: any, contact?: any) {
  const recipient = {
    jobTitle: application?.job_title || '',
    company: application?.company_name || '',
  }
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const clStructured = application.generated_cover_letter_json
  if (clStructured && typeof clStructured === 'object') {
    return {
      opening: clStructured.opening || '',
      body_paragraphs: Array.isArray(clStructured.body_paragraphs)
        ? clStructured.body_paragraphs
        : [],
      closing: clStructured.closing || '',
      contact: contact || undefined,
      date,
      recipient,
    }
  }
  const paras = (application.generated_cover_letter || '')
    .split('\n\n')
    .map((p: string) => p.trim())
    .filter(Boolean)
  return {
    opening: paras[0] || '',
    body_paragraphs: paras.slice(1, paras.length > 1 ? -1 : undefined),
    closing: paras.length > 1 ? paras[paras.length - 1] : '',
    contact: contact || undefined,
    date,
    recipient,
  }
}

// Build the structured CV, preferring the JSON stored at generation time and
// falling back to the lossy plain-text reparser only for legacy records.
export function buildStructuredCv(application: any, profileData?: ProfileLike | null) {
  const cvStructured = application.generated_cv_json
  if (cvStructured && typeof cvStructured === 'object') {
    return cvStructured
  }
  return convertPlainTextCvToStructured(
    application.generated_cv || '',
    profileData?.email || undefined,
    `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim()
  )
}

// Produce the full, print-ready HTML document for an application + template.
export function buildPreviewHtml(
  application: any,
  profileData: ProfileLike | null | undefined,
  template: string,
  documentType: 'cv' | 'coverLetter'
): string {
  const templateGenerator = templateGenerators[template] || generateModernHtml
  let html = ''
  if (documentType === 'coverLetter') {
    // Pass the CV header through so the letterhead matches the paired CV exactly.
    const structuredCv = buildStructuredCv(application, profileData)
    html = templateGenerator(
      null,
      'coverLetter',
      buildCoverLetterData(application, structuredCv?.header)
    )
  } else {
    html = templateGenerator(buildStructuredCv(application, profileData), 'cv')
  }
  return buildDocument(html)
}
