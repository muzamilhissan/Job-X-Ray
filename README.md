# Job X-Ray

Chrome extension that turns any job posting into a **fixed summary template**, and (with your PDF CV) scores **how suitable you are for that role**.

**Cost:** $0 for personal use — Google Gemini free API. No local LLM download.

## Stack

- Chrome Extension (Manifest V3) + React + Vite
- Local Express API on `http://localhost:8787`
- Gemini (`gemini-3.6-flash`) behind an `AIProvider` interface
- PDF CV upload → text extract → Chrome storage → fit score on analyze

## Setup

### 1. Install

```bash
cd /Users/muzzamilhissan/Xray
npm install
npm run build -w @job-xray/shared-types
```

### 2. Gemini API key

Key lives only in `apps/api/.env` (gitignored). Never put it in the extension.

```bash
# apps/api/.env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.6-flash
```

Get / rotate a key: [Google AI Studio](https://aistudio.google.com/apikey)

If you pasted a key in chat, **delete it in AI Studio and create a new one**, then update `.env`.

### 3. Run API

```bash
npm run dev:api
```

Check: open http://localhost:8787/health

### 4. Build & load extension

```bash
npm run build -w @job-xray/extension
```

Or watch mode:

```bash
npm run dev:extension
```

Then in Chrome:

1. `chrome://extensions` → Developer mode ON  
2. **Load unpacked** → select `apps/extension/dist`  
3. Open any job page → click the Job X-Ray icon (side panel)

## What works now

- Side panel UI with **full fixed template** (fit, role reality, must/nice/hidden, red flags, comp, work setup, interview)
- API health + Gemini provider + Zod-validated AI JSON
- PDF CV upload / parse / store on device
- **LinkedIn** extractor + **generic** (JSON-LD JobPosting) extractor
- Description cleaning before AI

## Next steps

- Dedicated Indeed / Greenhouse / Lever extractors
- Demo mode UI toggle
- Dark/light polish + export

## Product pillars

1. **Same template for every job** — role reality, must-haves, red flags, quality, interview focus  
2. **Your fit** — PDF CV vs this job (score, strengths, gaps)
