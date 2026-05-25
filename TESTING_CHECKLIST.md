# CV and Cover Letter Export Testing Checklist

## Implementation Summary

All code changes have been committed and deployed:
- ✅ TypeScript compilation: No errors
- ✅ Dev server startup: Successful
- ✅ All imports and exports: Correctly wired
- ✅ Database migration: Prepared (supabase_add_profile_fields.sql)
- ✅ Git commit: Pushed to origin/dev

## Architecture Overview

The system now works as follows:

1. **Generation Phase** (pages/api/generate-application.ts)
   - Claude generates structured JSON with CV and cover letter data
   - Converted to plain text and stored in database for backward compatibility
   - Profile fields now include: website, linkedin_url, photo_path

2. **Export Phase** (pages/api/applications/export-docx.ts, export-pdf.ts)
   - Plain text CV is converted back to structured format
   - Routed to appropriate template generator based on selected style
   - Modern, Professional, or ATS template applied
   - Returns formatted DOCX or PDF file

3. **Template Generators** (lib/templates/)
   - **Modern** (modern.ts): Colorful design, blue (#2563EB) + orange (#FF6B35)
   - **Professional** (professional.ts): Conservative navy (#1E3A8A) + gray
   - **ATS** (ats.ts): Plain text, no formatting, ATS-optimized

## Pre-Testing Verification

The following have been verified to compile and be structurally correct:

### Template Generator Exports
- generateModernDocx / generateModernPdf
- generateProfessionalDocx / generateProfessionalPdf
- generateAtsDocx / generateAtsPdf

### Export Endpoint Routing
Both export-docx.ts and export-pdf.ts correctly:
- Import all three template generators
- Convert plain text to structured format using convertPlainTextCvToStructured()
- Route to correct generator based on template ID
- Support both CV and cover letter exports
- Include proper error handling

### Backward Compatibility
- Old plain text CVs will be automatically converted to structured format on export
- convertPlainTextCvToStructured() handles multiple section header variations
- Fallback to legacy generateDocxBuffer() for unknown templates

## Testing Steps

### 1. Database Migration (if using Supabase)
```sql
-- Add these columns to user_profiles table:
ALTER TABLE user_profiles ADD COLUMN website VARCHAR(500);
ALTER TABLE user_profiles ADD COLUMN linkedin_url VARCHAR(500);
ALTER TABLE user_profiles ADD COLUMN photo_path VARCHAR(500);
```
Or use the migration file: `supabase_add_profile_fields.sql`

### 2. Update User Profile
- Navigate to dashboard/profile
- Fill in new fields:
  - Professional Website (e.g., https://portfolio.example.com)
  - LinkedIn URL (e.g., https://linkedin.com/in/username)
  - Photo (optional)
- Save profile

### 3. Generate an Application
- Create or select an application
- Click "Generate" button
- Wait for Claude to generate structured JSON
- Verify generation completes without error

### 4. Test Modern Template Exports
**DOCX Export:**
- Click "Export" → select "Modern" template → "DOCX"
- Verify file downloads as `[Company]_[Role]_CV.docx`
- Open in Word and verify:
  - Name appears in blue, larger font (20pt)
  - Section headers have colored backgrounds (blue/orange accents)
  - Contact info properly formatted
  - Skills organized by category
  - Experience bullets properly formatted
  - Overall colorful, modern appearance

**PDF Export:**
- Click "Export" → select "Modern" template → "PDF"
- Verify file downloads as `[Company]_[Role]_CV_modern.pdf`
- Open in PDF viewer and verify:
  - Same visual treatment as DOCX
  - Colors match DOCX version
  - Proper spacing and layout
  - Text is selectable (not image-based)

### 5. Test Professional Template Exports
**DOCX Export:**
- Click "Export" → select "Professional" template → "DOCX"
- Verify file downloads as `[Company]_[Role]_CV.docx` (no suffix, this is default)
- Open in Word and verify:
  - Name appears in navy blue (1E3A8A), medium font (16pt)
  - Minimal color usage, conservative design
  - Tight spacing suitable for traditional industries
  - Professional, formal appearance
  - Suitable for finance, law, healthcare, government

**PDF Export:**
- Click "Export" → select "Professional" template → "PDF"
- Verify file downloads as `[Company]_[Role]_CV_professional.pdf`
- Verify visual treatment matches DOCX

### 6. Test ATS Template Exports
**DOCX Export:**
- Click "Export" → select "ATS" template → "DOCX"
- Verify file downloads as `[Company]_[Role]_CV_ats.docx`
- Open in Word and verify:
  - Plain text with NO colors or special formatting
  - Standard fonts (Arial) only
  - ALL CAPS section headers (PROFESSIONAL EXPERIENCE, SKILLS, etc.)
  - Bullet points using standard dashes (-)
  - 1-inch margins all around
  - Clean, simple formatting optimized for ATS parsing

**PDF Export:**
- Click "Export" → select "ATS" template → "PDF"
- Verify similar plain-text treatment
- Verify suitable for uploading to ATS systems

### 7. Test Cover Letter Exports
**Modern Template:**
- Click "Export" → select "Modern" template → "DOCX" → document type "Cover Letter"
- Verify colorful design applied to cover letter
- Check opening paragraph, body paragraphs, and closing are properly formatted

**Professional Template:**
- Click "Export" → select "Professional" template → "DOCX" → document type "Cover Letter"
- Verify conservative design applied

**ATS Template:**
- Click "Export" → select "ATS" template → "DOCX" → document type "Cover Letter"
- Verify plain text format

### 8. Test Backward Compatibility
- If you have old applications with plain text CVs
- Export one using Modern template
- Verify it still exports correctly (plain text is converted to structured)
- No errors should occur

## Expected Visuals

### Modern Template (DOCX)
```
[Name in large blue text]
[Contact info]

PROFESSIONAL SUMMARY [section with blue bar]
[Summary text]

SKILLS [section with orange bar]
Category 1: skill1, skill2, skill3
Category 2: skill4, skill5

[etc.]
```

### Professional Template (DOCX)
```
[Name in navy blue, smaller]
[Contact info]

PROFESSIONAL SUMMARY
[Summary text, minimal color]

SKILLS
[Conservative layout, navy only]

[etc.]
```

### ATS Template (DOCX)
```
NAME
email@example.com
phone
city, state

PROFESSIONAL SUMMARY
Summary text here

SKILLS
Category: skill1, skill2, skill3

[etc., all plain text]
```

## Troubleshooting

### Export fails with "Template not found"
- Verify the template ID matches: 'modern', 'professional', or 'ats'
- Check export endpoints are importing generators

### Document looks wrong visually
- Modern: Check colors are #2563EB (blue) and #FF6B35 (orange)
- Professional: Check color is #1E3A8A (navy)
- ATS: Should have NO colors, plain text only

### JavaScript errors in console
- Check page console for any runtime errors
- Verify docx and pdfkit libraries are installed: `npm list docx pdfkit`

### Export takes very long
- First export may be slower due to template compilation
- Subsequent exports should be faster

## Files Changed

### New Files
- `lib/templates/modern.ts` - Modern template generator
- `lib/templates/professional.ts` - Professional template generator
- `lib/templates/ats.ts` - ATS template generator
- `lib/exportConverters.ts` - Plain text ↔ structured conversion
- `CV_COVER_LETTER_DESIGN_SPECS.md` - Design specifications
- `supabase_add_profile_fields.sql` - Database migration

### Modified Files
- `pages/api/generate-application.ts` - Updated to return structured JSON
- `pages/api/applications/export-docx.ts` - Integrated new templates
- `pages/api/applications/export-pdf.ts` - Integrated new templates
- `pages/api/save-profile.ts` - Added new profile fields
- `pages/dashboard/index.tsx` - Updated profile form UI

## Deployment Status

- Dev branch: Pushed to origin/dev
- Vercel: Should auto-deploy via GitHub integration
- Check Vercel dashboard for deployment status at: vercel.com

## Success Criteria

✅ All three template styles export without errors
✅ DOCX and PDF exports work for all three styles
✅ Modern template has colorful design with correct colors
✅ Professional template has minimal color, conservative design
✅ ATS template is plain text with no formatting
✅ New profile fields are collected and used in exports
✅ Backward compatibility with old plain text CVs maintained
✅ Both CV and cover letter exports work correctly
