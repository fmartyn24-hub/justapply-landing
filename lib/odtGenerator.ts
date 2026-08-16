import JSZip from 'jszip'

// Minimal but valid OpenDocument Text (.odt) generator — just enough
// structure (mimetype, manifest, styles, content) for LibreOffice/Word/Google
// Docs to open a plain paragraph-based document. No rich formatting beyond
// bold for the name line.

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function paragraph(text: string, style?: string): string {
  if (!text) return `<text:p/>`
  const styleAttr = style ? ` text:style-name="${style}"` : ''
  return `<text:p${styleAttr}>${escapeXml(text)}</text:p>`
}

export async function generateOdt(lines: string[], boldFirstLine = true): Promise<Buffer> {
  const zip = new JSZip()

  // Must be the first entry, stored uncompressed.
  zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' })

  zip.file(
    'META-INF/manifest.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`
  )

  zip.file(
    'styles.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.2">
  <office:styles>
    <style:style style:name="Bold" style:family="paragraph">
      <style:text-properties fo:font-weight="bold" fo:font-size="13pt"/>
    </style:style>
  </office:styles>
</office:document-styles>`
  )

  const body = lines.map((line, i) => paragraph(line, boldFirstLine && i === 0 ? 'Bold' : undefined)).join('\n')

  zip.file(
    'content.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.2">
  <office:automatic-styles/>
  <office:body>
    <office:text>
      ${body}
    </office:text>
  </office:body>
</office:document-content>`
  )

  return zip.generateAsync({ type: 'nodebuffer' })
}
