import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { EXPORT_TEMPLATES, type ExportTemplate } from '@/lib/exportTemplates'

interface ExportTemplateSelectorProps {
  isOpen: boolean
  documentType: 'cv' | 'coverLetter'
  exportFormat: 'docx' | 'pdf'
  applicationId: string
  onSelectTemplate: (template: ExportTemplate) => Promise<void>
  onChangeDocumentType: (type: 'cv' | 'coverLetter') => void
  onClose: () => void
}

export function ExportTemplateSelector({
  isOpen,
  documentType,
  exportFormat,
  applicationId,
  onSelectTemplate,
  onChangeDocumentType,
  onClose,
}: ExportTemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('professional')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSelectTemplate = async (template: ExportTemplate) => {
    setSelectedTemplateId(template.id)
    setExporting(true)
    setError(null)
    try {
      // Open preview page in new tab with template and document type params
      const previewUrl = `/api/preview/${applicationId}?template=${template.id}&type=${documentType}`
      window.open(previewUrl, '_blank')
      setExporting(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      setExporting(false)
    }
  }

  const docLabel = documentType === 'cv' ? 'CV' : 'Cover Letter'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Choose a design for your {docLabel}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              disabled={exporting}
            >
              ×
            </button>
          </div>

          {/* Document type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => onChangeDocumentType('cv')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                documentType === 'cv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={exporting}
            >
              📄 CV
            </button>
            <button
              onClick={() => onChangeDocumentType('coverLetter')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                documentType === 'coverLetter'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={exporting}
            >
              📝 Cover Letter
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Template cards */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXPORT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                disabled={exporting}
                className={`text-left rounded-lg border-2 p-6 transition ${
                  selectedTemplateId === template.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* Template name */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                {/* Color preview */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Color scheme:</p>
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-200"
                      style={{ backgroundColor: `#${template.colors.primary}` }}
                      title="Primary"
                    />
                    <div
                      className="w-8 h-8 rounded border border-gray-200"
                      style={{ backgroundColor: `#${template.colors.heading}` }}
                      title="Heading"
                    />
                    <div
                      className="w-8 h-8 rounded border border-gray-200"
                      style={{ backgroundColor: `#${template.colors.text}` }}
                      title="Text"
                    />
                    {template.colors.background && (
                      <div
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: `#${template.colors.background}` }}
                        title="Background"
                      />
                    )}
                    {template.colors.accent && (
                      <div
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: `#${template.colors.accent}` }}
                        title="Accent"
                      />
                    )}
                  </div>
                </div>

                {/* Sample text */}
                <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-100">
                  <p
                    className="text-xs font-bold mb-1"
                    style={{ color: `#${template.colors.heading}` }}
                  >
                    Sample Heading
                  </p>
                  <p className="text-xs" style={{ color: `#${template.colors.text}` }}>
                    This is how your content will look in this template.
                  </p>
                </div>

                {/* Format info */}
                <p className="text-xs text-gray-500">Export as: {exportFormat.toUpperCase()}</p>

                {/* Selection indicator */}
                {selectedTemplateId === template.id && (
                  <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                    <span className="mr-1">✓</span> Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <p className="text-xs text-gray-500 py-2">Click a template to preview and download</p>
        </div>
      </div>
    </div>
  )
}
