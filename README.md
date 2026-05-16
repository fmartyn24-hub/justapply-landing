# justapply.eu — Landing Page

AI-powered job search operating system. Upload your CV, paste a job, get a tailored CV + cover letter.

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Hosting:** Vercel
- **Database:** Supabase (coming)
- **AI:** Claude API (coming)

## Getting Started

### Install dependencies
```bash
npm install
```

### Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Vercel

1. Push this repo to GitHub
2. Import repo in Vercel dashboard
3. Click "Deploy"
4. Add domain in Vercel settings

## Project Structure

```
justapply-landing/
├── pages/
│   ├── index.js           # Landing page
│   ├── _app.js            # Next.js wrapper
│   └── api/
│       └── subscribe.js   # Email signup endpoint
├── styles/
│   └── globals.css        # Tailwind + custom styles
├── package.json
├── tailwind.config.js
├── next.config.js
├── postcss.config.js
└── vercel.json
```

## Features

✓ Responsive design (mobile-first)
✓ Email signup form
✓ SEO optimized
✓ Fast (Tailwind, minimal dependencies)
✓ Production-ready

## Next Steps

1. **Integrate Supabase** — Store emails in database
2. **Add authentication** — User signup/login
3. **Build MVP** — CV upload, job paste, AI generation
4. **Create tracker** — Application management dashboard

## License

MIT
