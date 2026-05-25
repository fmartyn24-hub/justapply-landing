# Modern Template PDF Export Setup Guide

## Overview

The Modern template uses HTML-to-PDF conversion to create beautifully designed CVs and cover letters. This requires a Chrome/Chromium browser engine.

## Requirements

### Local Development

**Option 1: Install Google Chrome (Recommended)**
- Download from: https://www.google.com/chrome/
- Install on your computer
- The system will automatically detect and use it

**Option 2: Install Chromium**
- Lightweight alternative to Chrome
- macOS: `brew install chromium`
- Ubuntu: `sudo apt-get install chromium-browser`
- Windows: Download from https://chromium.woolyss.com/

### Production (Vercel)

✅ **Automatically handled** — The application includes `@sparticuz/chromium`, which provides a serverless-optimized Chromium binary for Vercel.

No additional setup needed on Vercel.

## How It Works

### Local Development
1. User exports a CV as "Modern" template → PDF
2. The application detects system Chrome/Chromium
3. Converts HTML to PDF using detected browser
4. Returns beautiful formatted PDF

### Vercel Production
1. User exports a CV as "Modern" template → PDF
2. The application detects it's running on Vercel
3. Uses `@sparticuz/chromium` (included binary)
4. Converts HTML to PDF using serverless Chrome
5. Returns beautiful formatted PDF

## Troubleshooting

### "Could not find Chrome" Error

**This means:** Chrome/Chromium is not installed on your computer.

**Fix:**
1. Install Google Chrome from https://www.google.com/chrome/
2. Try exporting again

### Chrome is installed but still getting error

**Try these steps:**
1. Restart the development server:
   ```bash
   npm run dev
   ```

2. Verify Chrome is in PATH:
   ```bash
   which google-chrome
   # or
   which chromium
   ```

3. If not in PATH, either:
   - Reinstall Chrome/Chromium
   - Or set environment variable (advanced):
     ```bash
     export PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
     ```

## Design Features

The Modern template includes:

- **Gradient Blue Header** - Professional color-blocking with name and contact info
- **Orange Accent Bars** - Left-side color bars for each section
- **Two-Column Skills Layout** - Better use of white space
- **Professional Typography** - Clean sans-serif with proper hierarchy
- **Styled Bullet Points** - Orange-colored achievement markers
- **Optimal Spacing** - Print-ready with proper margins

## Testing the Modern Template

1. Generate an application in the dashboard
2. Click "Export"
3. Select "Modern" template
4. Choose "PDF" format
5. Download and view the beautifully formatted CV

## Performance Notes

- First PDF generation may take 2-3 seconds (Chrome startup)
- Subsequent PDFs are faster
- File size: ~200-300KB (typical professional CV)

## Dependencies

- `html-pdf-node` - HTML to PDF conversion
- `@sparticuz/chromium` - Serverless Chrome for Vercel
- Chrome/Chromium - Browser engine (must be installed locally)

## Support

If you encounter issues:
1. Verify Chrome is installed
2. Check the error message in the browser console (F12)
3. Restart the development server
4. Ensure you have the latest code: `git pull origin dev`
