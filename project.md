# Job X-Ray — AI-Powered Job Intelligence Chrome Extension

## 1. PROJECT OVERVIEW

Build a production-quality Chrome Extension called **Job X-Ray**.

The product analyzes job postings from websites such as:

* LinkedIn
* Indeed
* Glassdoor
* Greenhouse
* Lever
* Workday
* Generic company career pages

The extension should allow the user to click:

**✨ X-Ray This Job**

It should extract the job posting from the current webpage, analyze it using AI, and display a beautiful side-panel dashboard explaining what the job actually requires.

The key product concept is:

> **"See what the job posting doesn't tell you at first glance."**

The application should identify both:

### Explicit information

Information directly stated in the job description.

### Inferred information

Signals that can reasonably be inferred from the responsibilities, wording, requirements, and structure of the job posting.

Every inferred claim MUST show supporting evidence from the job description.

Never present an inference as a confirmed fact.

---

# 2. CORE MVP GOAL

The first version must work completely locally and cost $0 for development.

Architecture:

Chrome Extension
→ Local Node.js API
→ Ollama
→ Local open-source LLM
→ Structured JSON
→ Chrome Side Panel

Do NOT require:

* OpenAI API
* paid AI API
* cloud database
* paid hosting
* external backend
* user account

for the MVP.

Everything should work locally.

---

# 3. TECHNOLOGY STACK

Use:

### Chrome Extension

* Manifest V3
* TypeScript
* React
* Vite
* Tailwind CSS
* Chrome Side Panel API
* Chrome Storage API

### Backend

* Node.js
* TypeScript
* Express
* Zod
* dotenv
* CORS
* helmet
* pino or another lightweight logger

### AI

* Ollama
* Local LLM
* Ollama HTTP API

The AI provider must be abstracted behind an interface so it can later support OpenAI/Anthropic/etc.

Example:

```ts
interface AIProvider {
  analyzeJob(input: JobAnalysisInput): Promise<JobAnalysis>;
}
```

Implement:

```ts
OllamaProvider
```

Later we should be able to add:

```ts
OpenAIProvider
AnthropicProvider
```

without changing the rest of the application.

### Testing

* Vitest
* Playwright where appropriate
* ESLint
* Prettier

---

# 4. PROJECT STRUCTURE

Create a monorepo:

```text
job-xray/
│
├── apps/
│   │
│   ├── extension/
│   │   ├── src/
│   │   │   ├── background/
│   │   │   ├── content/
│   │   │   ├── sidepanel/
│   │   │   │   ├── components/
│   │   │   │   ├── pages/
│   │   │   │   ├── hooks/
│   │   │   │   ├── lib/
│   │   │   │   └── types/
│   │   │   ├── popup/
│   │   │   ├── shared/
│   │   │   └── platforms/
│   │   │       ├── linkedin.ts
│   │   │       ├── indeed.ts
│   │   │       ├── glassdoor.ts
│   │   │       ├── greenhouse.ts
│   │   │       ├── lever.ts
│   │   │       ├── workday.ts
│   │   │       └── generic.ts
│   │   │
│   │   ├── public/
│   │   ├── manifest.json
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── ai/
│       │   │   ├── AIProvider.ts
│       │   │   ├── OllamaProvider.ts
│       │   │   └── prompts/
│       │   ├── validation/
│       │   ├── middleware/
│       │   ├── utils/
│       │   └── types/
│       ├── .env.example
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   ├── extraction/
│   └── schemas/
│
├── tests/
│
├── docs/
│
├── .gitignore
├── package.json
├── README.md
└── docker-compose.yml
```

Keep the architecture modular and maintainable.

---

# 5. CHROME EXTENSION MANIFEST

Use Manifest V3.

Required permissions should be minimal.

Potential permissions:

```json
{
  "permissions": [
    "storage",
    "activeTab",
    "sidePanel"
  ]
}
```

Use host permissions only where genuinely required.

Avoid unnecessary permissions.

Do not request:

```text
tabs
history
bookmarks
cookies
webRequest
```

unless absolutely necessary.

The extension must follow Chrome extension security best practices.

---

# 6. USER EXPERIENCE

The user visits a job page.

Example:

```text
https://www.linkedin.com/jobs/view/...
```

The extension detects that this appears to be a job page.

The extension should show:

```text
✨ Job X-Ray
Job detected

[ Analyze Job ]
```

When the user clicks Analyze Job:

```text
Extracting job...
      ↓
Cleaning content...
      ↓
Analyzing...
      ↓
Generating insights...
```

Then display the results in the Chrome side panel.

---

# 7. SIDE PANEL UI

Build a modern, premium-looking UI.

Design inspiration:

* Linear
* Notion
* Arc
* Raycast
* modern SaaS dashboards

Use:

* clean typography
* rounded cards
* subtle borders
* good spacing
* responsive layout
* accessible contrast
* light/dark mode support

Do not make it look like a generic AI chatbot.

This is a job intelligence product.

---

# 8. SIDE PANEL LAYOUT

Header:

```text
✨ Job X-Ray

Junior Full Stack Developer
ABC Software

[ Re-analyze ]
```

Then sections:

```text
┌──────────────────────────────┐
│ 🎯 ROLE REALITY              │
│                              │
│ Advertised                   │
│ Junior Developer             │
│                              │
│ AI Assessment                │
│ Full Stack + AI Developer    │
│                              │
│ Seniority                    │
│ Junior / Mid                 │
└──────────────────────────────┘
```

Then:

```text
📊 MATCH / COMPLEXITY
```

Then:

```text
🔥 MUST HAVE
```

Then:

```text
🟡 NICE TO HAVE
```

Then:

```text
🕵️ HIDDEN REQUIREMENTS
```

Then:

```text
⚠️ RED FLAGS
```

Then:

```text
💰 COMPENSATION
```

Then:

```text
🌍 WORK ARRANGEMENT
```

Then:

```text
🎯 SKILL GAP
```

Then:

```text
🎤 INTERVIEW PREDICTIONS
```

---

# 9. JOB EXTRACTION SYSTEM

Create a platform abstraction.

Interface:

```ts
interface JobExtractor {
  canHandle(url: string, document: Document): boolean;

  extract(document: Document): RawJobData;
}
```

Implement:

```text
LinkedInExtractor
IndeedExtractor
GlassdoorExtractor
GreenhouseExtractor
LeverExtractor
WorkdayExtractor
GenericExtractor
```

Each extractor should attempt to extract:

```ts
interface RawJobData {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  url: string;
  platform: string;
}
```

---

# 10. GENERIC EXTRACTOR

The generic extractor is extremely important.

It should work on unknown career pages.

Use multiple strategies:

1. JSON-LD JobPosting schema
2. Meta tags
3. Common semantic HTML
4. Headings
5. Main content
6. DOM heuristics

Look for:

```text
JobPosting
application/ld+json
jobTitle
hiringOrganization
description
jobLocation
baseSalary
employmentType
datePosted
```

Prefer structured JSON-LD when available.

---

# 11. CONTENT CLEANING

Before sending anything to AI:

Remove:

* navigation
* footer
* cookie banners
* ads
* related jobs
* recommended jobs
* comments
* social feeds
* tracking text
* duplicate text

Normalize:

* whitespace
* line breaks
* duplicated sentences
* HTML entities

Create:

```ts
cleanJobDescription(text: string): string
```

Set reasonable maximum input size.

Do not send unlimited webpage content to the AI.

---

# 12. JOB DATA SCHEMA

Create strict Zod schemas.

Example:

```ts
const JobDataSchema = z.object({
  title: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  employmentType: z.string().optional(),
  description: z.string(),
  url: z.string().url(),
  platform: z.string()
});
```

All AI output must also be validated with Zod.

Never blindly trust model JSON.

---

# 13. AI ANALYSIS

The AI should analyze:

### Role

* advertised title
* likely actual role
* role category
* role mismatch

### Seniority

* advertised seniority
* estimated seniority
* evidence

### Skills

* must-have
* preferred
* implied
* technical
* soft skills

### Responsibilities

Categorize responsibilities.

### Hidden requirements

Identify signals that are not directly presented as requirements.

Examples:

```text
Client communication
Independent work
Production deployment
On-call responsibility
Leadership
Cross-functional communication
Sales involvement
Project management
Multiple hats
```

### Compensation

Extract:

* stated salary
* currency
* salary period
* bonuses
* equity
* benefits

Never invent salary.

If salary isn't provided:

```text
salary.status = "not_disclosed"
```

Do NOT fabricate a salary estimate in the MVP.

---

# 14. IMPORTANT: EXPLICIT VS INFERRED

Every insight must have a type:

```ts
type EvidenceType =
  | "explicit"
  | "inferred";
```

Example:

```json
{
  "insight": "Client communication is likely expected",
  "type": "inferred",
  "confidence": 0.82,
  "evidence": "Work directly with clients to understand requirements."
}
```

The UI should visually distinguish:

```text
✓ Explicit
🧠 Inferred
```

Never claim that an inference is certain.

---

# 15. HIDDEN REQUIREMENTS

Create:

```ts
interface HiddenRequirement {
  title: string;
  explanation: string;
  evidence: string;
  confidence: number;
}
```

Examples:

```text
Client communication
Evidence:
"Work closely with clients..."

Production responsibility
Evidence:
"Deploy and maintain applications..."

Independent ownership
Evidence:
"Own projects from conception through deployment..."
```

Limit the number of hidden requirements.

Do not generate meaningless generic insights.

Only return meaningful insights supported by evidence.

---

# 16. ROLE REALITY

Create:

```ts
interface RoleReality {
  advertisedTitle: string;
  likelyRole: string;
  confidence: number;
  explanation: string;
  evidence: string[];
}
```

Example:

```text
Advertised:
Junior Software Engineer

Likely:
Full Stack AI Developer

Reason:
The role requires frontend, backend, database,
deployment and AI integration responsibilities.
```

---

# 17. SENIORITY ANALYSIS

Return:

```ts
interface SeniorityAnalysis {
  advertised: string | null;
  estimated: string;
  confidence: number;
  reasons: string[];
}
```

Analyze:

* years of experience
* responsibility
* autonomy
* architecture
* leadership
* client ownership
* production responsibility
* mentoring

Do not automatically assume that broad technology requirements mean seniority.

Explain reasoning.

---

# 18. RED FLAG DETECTION

Detect possible warning signals:

```text
Unrealistic skill requirements
Unclear responsibilities
Extreme technology breadth
"Rockstar" language
"Work hard/play hard"
Unpaid trial work
Suspicious payment requests
Unclear employer
Impossible experience requirements
Salary inconsistencies
Contradictory job details
```

Every red flag must include evidence.

Use severity:

```text
low
medium
high
```

Do not accuse a company of fraud based on weak evidence.

Use language like:

```text
"Potential concern"
```

rather than:

```text
"This company is a scam"
```

---

# 19. JOB QUALITY SCORE

Create a Job Quality Score from 0–100.

Factors:

```text
Description clarity
Requirement clarity
Compensation transparency
Role consistency
Company information
Responsibility realism
Potential warning signals
```

Show:

```text
Job Quality
82/100
Good
```

Explain the score.

---

# 20. CANDIDATE MATCHING — PREPARE ARCHITECTURE

Do not require this for the first MVP.

However, design the system so we can later add:

```text
Resume
   ↓
Candidate Profile
   ↓
Job Requirements
   ↓
Semantic Matching
   ↓
Fit Score
```

Future schema:

```ts
interface CandidateProfile {
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
}
```

Future output:

```ts
interface MatchResult {
  score: number;
  strengths: string[];
  skillGaps: string[];
  experienceGaps: string[];
  recommendations: string[];
}
```

---

# 21. INTERVIEW PREDICTION

Analyze the job and generate likely interview topics.

Example:

```text
Interview Focus

⭐⭐⭐⭐⭐ Next.js
⭐⭐⭐⭐ Node.js
⭐⭐⭐⭐ PostgreSQL
⭐⭐⭐⭐ REST APIs
⭐⭐⭐ Docker
⭐⭐⭐ AI integration
```

Generate questions such as:

```text
How have you used Next.js in production?

How would you design a REST API?

How would you optimize a PostgreSQL query?

How would you integrate an LLM into a production application?
```

Only generate questions based on technologies/responsibilities actually found in the job description.

---

# 22. AI PROMPT DESIGN

Do NOT create one enormous unstructured prompt.

Use a system prompt and structured input.

System prompt should tell the AI:

```text
You are Job X-Ray, an expert job-market analyst.

Analyze the supplied job posting.

You must distinguish explicit facts from reasonable inferences.

Never invent information.

Every inference must contain evidence from the supplied job posting.

If information is missing, return null or "not_disclosed".

Do not use external knowledge to claim facts about the company.

Return valid JSON matching the supplied schema.
```

Use low temperature where supported.

Prefer structured output.

---

# 23. AI RESPONSE

Use a strict schema similar to:

```ts
interface JobAnalysis {
  roleReality: {
    advertisedTitle: string;
    likelyRole: string;
    confidence: number;
    explanation: string;
    evidence: string[];
  };

  seniority: {
    advertised: string | null;
    estimated: string;
    confidence: number;
    reasons: string[];
  };

  skills: {
    mustHave: string[];
    preferred: string[];
    technical: string[];
    soft: string[];
  };

  hiddenRequirements: {
    title: string;
    explanation: string;
    evidence: string;
    confidence: number;
  }[];

  redFlags: {
    title: string;
    explanation: string;
    evidence: string;
    severity: "low" | "medium" | "high";
  }[];

  compensation: {
    status: "disclosed" | "partial" | "not_disclosed";
    raw: string | null;
    currency: string | null;
  };

  workArrangement: {
    type: string | null;
    location: string | null;
    timezone: string | null;
  };

  jobQualityScore: {
    score: number;
    explanation: string;
  };

  interviewTopics: {
    topic: string;
    importance: number;
    questions: string[];
  }[];
}
```

---

# 24. BACKEND API

Create:

```text
GET /health
POST /api/analyze-job
POST /api/extract-job
```

Future endpoints:

```text
POST /api/analyze-resume
POST /api/match-job
GET /api/jobs
GET /api/jobs/:id
```

The MVP only needs:

```text
GET /health
POST /api/analyze-job
```

---

# 25. API REQUEST

```ts
POST /api/analyze-job
```

Input:

```json
{
  "job": {
    "title": "...",
    "company": "...",
    "location": "...",
    "description": "...",
    "url": "...",
    "platform": "linkedin"
  }
}
```

Response:

```json
{
  "success": true,
  "analysis": {}
}
```

---

# 26. ERROR HANDLING

Handle:

### Ollama not running

Show:

```text
AI service unavailable.

Please start Ollama and try again.
```

### No job detected

Show:

```text
We couldn't detect a job posting on this page.

Try opening the full job description.
```

### AI timeout

Show:

```text
Analysis took too long.

Try again.
```

### Invalid AI response

Automatically attempt one repair/retry.

Never crash the extension.

---

# 27. RATE LIMITING

Even though the MVP is local, design the backend with rate limiting.

For example:

```text
10 analysis requests/minute
```

Make it configurable via environment variables.

---

# 28. SECURITY

Do NOT:

* store API keys in the extension
* expose Ollama credentials
* use eval()
* inject unsafe HTML
* use innerHTML unnecessarily
* execute arbitrary page scripts
* send cookies
* collect browsing history
* collect unrelated webpage content

Sanitize extracted HTML.

Only send the job-related content to the backend.

---

# 29. PRIVACY

Create a privacy-first architecture.

The MVP should make clear:

```text
Job X-Ray only analyzes the job posting
you explicitly choose to analyze.
```

No automatic tracking.

No background collection of jobs.

No browsing history collection.

No cookies.

No personal data collection.

---

# 30. LOCAL STORAGE

Use Chrome Storage API for:

```text
settings
recent analyses
theme
backend URL
AI provider
```

Do not store huge job descriptions indefinitely.

Limit local history.

---

# 31. ANALYSIS HISTORY

For MVP:

Store recent analyses locally.

Example:

```text
Recent Jobs

Junior Full Stack Developer
ABC Software
82/100
2 hours ago

Backend Developer
XYZ Labs
74/100
Yesterday
```

Allow:

```text
Open
Delete
Clear History
```

---

# 32. LOADING EXPERIENCE

Use a staged progress UI.

Example:

```text
✨ Analyzing job

✓ Extracting job posting
✓ Cleaning content
● Understanding requirements
○ Detecting hidden signals
○ Predicting interview topics
```

Do not fake progress.

The backend should emit actual stages where practical.

---

# 33. DEMO MODE

Create a demo mode so the application can be tested without Ollama.

Example:

```text
VITE_DEMO_MODE=true
```

The extension can load a static example analysis.

This is useful for UI development.

---

# 34. SAMPLE JOB

Create a fixture:

```text
tests/fixtures/sample-job.json
```

Use a realistic Full Stack Developer job.

Include:

* React
* Next.js
* Node.js
* PostgreSQL
* AWS
* Docker
* client communication
* deployment
* 2–3 years experience

Use it for testing extraction and AI schema validation.

---

# 35. TESTING

Write tests for:

### Extraction

* LinkedIn
* Indeed
* Generic HTML
* JSON-LD JobPosting

### Cleaning

* removes navigation
* removes footer
* removes duplicate content

### Validation

* invalid AI response
* missing salary
* missing company
* missing location

### AI

Mock Ollama responses.

Do not require a real Ollama server for unit tests.

### API

Test:

```text
GET /health
POST /api/analyze-job
```

### UI

Test:

* loading state
* success state
* error state
* empty state
* analysis rendering

---

# 36. DEVELOPMENT COMMANDS

Root package should support:

```bash
npm install

npm run dev

npm run dev:extension

npm run dev:api

npm run build

npm run test

npm run lint

npm run format
```

---

# 37. OLLAMA SETUP

Document the setup clearly.

The README should explain:

1. Install Ollama.
2. Start Ollama.
3. Pull a suitable local model.
4. Start the API.
5. Start the extension.
6. Load the unpacked extension into Chrome.

Example:

```bash
ollama serve
```

Then:

```bash
ollama pull <chosen-model>
```

Do not hard-code an outdated model name without verifying compatibility.

Make the model configurable:

```env
OLLAMA_MODEL=...
OLLAMA_BASE_URL=http://localhost:11434
```

---

# 38. ENVIRONMENT VARIABLES

Create:

```text
apps/api/.env.example
```

Example:

```env
PORT=3001

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=your-model

CORS_ORIGIN=chrome-extension://*

NODE_ENV=development
```

Never commit `.env`.

---

# 39. EXTENSION BUILD

The final extension should produce:

```text
apps/extension/dist/
```

The dist directory must be loadable through:

Chrome
→ Extensions
→ Developer Mode
→ Load unpacked

Document this process in README.

---

# 40. PLATFORM SUPPORT STRATEGY

Do not assume every website has the same HTML structure.

Use adapters:

```text
platform detector
      ↓
specific extractor
      ↓
generic fallback
```

If a platform extractor fails:

```text
specific extractor
      ↓
generic extractor
```

The extension should not crash.

---

# 41. PERFORMANCE

The extension should be lightweight.

Do not:

* constantly scan the DOM
* continuously send page contents
* make automatic AI calls
* create unnecessary background requests

Only analyze after user action.

Debounce DOM observation.

---

# 42. ACCESSIBILITY

Support:

* keyboard navigation
* screen readers
* proper labels
* sufficient contrast
* focus states
* semantic HTML

Buttons must have accessible labels.

---

# 43. RESPONSIVE UI

The side panel must work at narrow widths.

Cards should stack vertically.

Avoid horizontal scrolling.

---

# 44. DARK MODE

Support:

```text
Light
Dark
System
```

Use Tailwind classes.

Persist preference with Chrome Storage.

---

# 45. FUTURE ROADMAP

Design the code so these can be added later:

## Phase 2

Resume upload.

Resume parser.

Candidate profile.

Job match score.

Skill gaps.

## Phase 3

Resume tailoring.

ATS keyword analysis.

Cover letter generation.

## Phase 4

Job tracking.

Applications.

Interview tracking.

## Phase 5

Company intelligence.

Salary intelligence.

Ghost job detection.

## Phase 6

Cloud AI.

User accounts.

Subscription.

Web dashboard.

---

# 46. IMPORTANT PRODUCT PRINCIPLES

The extension must prioritize:

### Accuracy over creativity

Never invent information.

### Evidence over assumptions

Every inference must show evidence.

### Privacy

Only analyze what the user explicitly asks to analyze.

### Speed

A normal analysis should complete quickly.

### Transparency

Clearly label:

```text
Explicit
Inferred
Unknown
```

### Useful insights

Avoid generic AI fluff.

Bad:

```text
Communication skills are important.
```

Good:

```text
Client communication is likely expected.

Evidence:
"Work directly with clients to gather requirements."
```

---

# 47. UI EXAMPLE

The final UI should feel approximately like:

```text
╭──────────────────────────────────╮
│ ✨ Job X-Ray                ⚙    │
│                                  │
│ Junior Full Stack Developer      │
│ ABC Software                     │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🎯 ROLE REALITY              │ │
│ │                              │ │
│ │ Advertised                   │ │
│ │ Junior Developer             │ │
│ │                              │ │
│ │ Likely role                  │ │
│ │ Full Stack AI Developer      │ │
│ │                              │ │
│ │ Confidence        87%        │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📊 JOB QUALITY               │ │
│ │                              │ │
│ │             82 / 100         │ │
│ │               Good           │ │
│ └──────────────────────────────┘ │
│                                  │
│ 🔥 MUST HAVE                    │
│                                  │
│ ✓ React                         │
│ ✓ Next.js                       │
│ ✓ Node.js                       │
│ ✓ PostgreSQL                    │
│                                  │
│ 🟡 NICE TO HAVE                 │
│                                  │
│ ○ AWS                           │
│ ○ Docker                        │
│                                  │
│ 🕵️ HIDDEN SIGNALS               │
│                                  │
│ ⚠ Client communication          │
│   Inferred · 82%                │
│                                  │
│   "Work directly with clients"  │
│                                  │
│ ⚠ Production ownership          │
│   Inferred · 76%                │
│                                  │
│ ⚠️ POTENTIAL CONCERNS           │
│                                  │
│ Broad technology requirements   │
│ Medium                          │
│                                  │
│ 🎤 INTERVIEW FOCUS              │
│                                  │
│ Next.js              ★★★★★      │
│ Node.js              ★★★★★      │
│ PostgreSQL           ★★★★☆      │
│ AI integration       ★★★★☆      │
│                                  │
╰──────────────────────────────────╯
```

---

# 48. IMPLEMENTATION ORDER

IMPORTANT:

Do NOT attempt to write the entire project blindly in one step.

Implement in this order.

## Step 1

Initialize monorepo.

Set up:

* TypeScript
* Vite
* React
* Tailwind
* Express
* shared types
* ESLint
* Prettier

Verify builds.

## Step 2

Build Chrome Manifest V3.

Create:

* background service worker
* content script
* side panel

Verify extension loads in Chrome.

## Step 3

Implement generic job extraction.

Use sample pages and fixtures.

Verify extracted data.

## Step 4

Implement platform adapters.

Start with:

1. LinkedIn
2. Indeed
3. Generic/JSON-LD

Then add:

4. Greenhouse
5. Lever
6. Glassdoor
7. Workday

## Step 5

Build backend.

Implement:

```text
GET /health
POST /api/analyze-job
```

## Step 6

Implement Ollama provider.

Create AI provider abstraction.

## Step 7

Create strict AI schema.

Validate every AI response.

## Step 8

Implement Job X-Ray analysis.

## Step 9

Build polished side panel.

## Step 10

Add analysis history.

## Step 11

Add error handling.

## Step 12

Add tests.

## Step 13

Add documentation.

## Step 14

Perform security review.

## Step 15

Perform final production-quality code review.

---

# 49. CURSOR BEHAVIOR

While implementing:

1. Inspect the existing repository before creating files.
2. Do not overwrite existing code unnecessarily.
3. Reuse existing utilities.
4. Keep modules small.
5. Use TypeScript strictly.
6. Avoid `any`.
7. Add comments only where they provide meaningful context.
8. Do not duplicate logic.
9. Validate external data.
10. Handle failures gracefully.
11. Run tests after major changes.
12. Run lint and type checking.
13. Fix errors before moving to the next phase.
14. Never leave placeholder TODO implementations for core functionality.
15. Do not claim something works unless it has been tested.

---

# 50. DEFINITION OF DONE

The MVP is complete when:

* Chrome extension loads successfully.
* Side panel opens.
* Extension detects supported job pages.
* Generic extraction works.
* LinkedIn extraction works.
* Indeed extraction works.
* JSON-LD extraction works.
* User can click "X-Ray This Job".
* Job data is sent to local API.
* API communicates with Ollama.
* AI returns validated structured JSON.
* Role Reality appears.
* Seniority appears.
* Must-have skills appear.
* Preferred skills appear.
* Hidden requirements appear.
* Explicit/inferred labels appear.
* Evidence appears.
* Red flags appear.
* Job quality score appears.
* Interview topics appear.
* Loading states work.
* Error states work.
* Analysis history works locally.
* Dark mode works.
* No API key is required.
* No paid service is required for local development.
* README contains complete setup instructions.
* Tests pass.
* TypeScript passes.
* ESLint passes.
* Production build succeeds.

---

# 51. FINAL INSTRUCTION TO CURSOR

Start by inspecting the repository.

Do NOT immediately generate all application code.

First:

1. Inspect the repository.
2. Determine whether it is empty or already contains a project.
3. Create an implementation plan.
4. Present the plan briefly.
5. Then implement Phase 1 only.
6. Run the appropriate tests/build/type checks.
7. Fix all errors.
8. Continue phase by phase.

At every stage, keep the application runnable.

The final result should be a real, maintainable Chrome extension rather than a mockup.

Prioritize working functionality over excessive abstraction.

Do not use paid APIs for the MVP.

Use Ollama as the default local AI provider.

Make the AI provider replaceable so cloud AI can be introduced later.

The product name is:

**Job X-Ray**

Tagline:

**"See what the job posting doesn't tell you at first glance."**
