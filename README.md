# AP Microeconomics AI Study Guide Platform

A graph-first AP Microeconomics study system built as a monorepo with a premium Next.js frontend, a FastAPI ingestion backend, and reusable shared packages for graph rendering, UI, and curriculum models.

## What It Includes

- Interactive AP Micro graph lab with draggable curves, surplus and deadweight-loss overlays, clickable points and regions, and graph-specific tutor hooks
- Topic pages organized by AP Micro units and subtopics
- Study modes including standard, ADHD, visual, exam, tutor, and speed review
- Practice system with MCQs, FRQs, graph-click questions, flashcards, and review tracking
- PDF ingestion pipeline for multiple AP Micro sources with source-aware topic merging
- In-app source reader with highlighting, selection actions, and tutor-assist hooks
- Flashcard workspace with Quizlet-style imports and card-side tutor chat
- Test-prep builder for custom study guides based on selected topics and highlighted items

## Monorepo Layout

```text
apps/
  web/       Next.js frontend
  api/       FastAPI backend
packages/
  ui/            shared UI components
  graph-engine/  reusable SVG graph engine
  shared-types/  shared schemas and types
  content-core/  seeded AP Micro curriculum data
```

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- FastAPI
- SQLAlchemy
- PyMuPDF
- SQLite locally, structured for PostgreSQL later

## Local Setup

1. Install dependencies:

```bash
npm install
python -m pip install -r apps/api/requirements.txt
```

2. Copy the example environment file and update the PDF paths:

```bash
copy .env.example .env
```

3. Set `PDF_SOURCE_PATHS` in `.env` to your local AP Micro PDF files.

Example:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
PDF_SOURCE_PATHS=C:\path\to\64-Elia Kacapyr.pdf;C:\path\to\krugman_s_economics_for_ap.pdf;C:\path\to\ap-microeconomics-course-and-exam-description.pdf
DATABASE_URL=sqlite:///./apps/api/apmicro.db
VECTOR_BACKEND=json
```

4. Start the app:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Backend docs:

```text
http://127.0.0.1:8000/docs
```

## Useful Commands

```bash
npm run dev
npm run build
npm run typecheck
python -m compileall apps/api/app
```

## Notes

- Textbook PDFs are intentionally not stored in the GitHub repo. Keep them locally and point `PDF_SOURCE_PATHS` at those files.
- The backend bootstraps configured PDFs into the local database on first startup.
- The current graph tutor and selection-assist flows are scaffolded app-side logic, ready for a real hosted LLM integration.

## Current Status

This repo already includes:

- the premium study shell
- the graph lab and major AP Micro graph modules
- topic pages and seeded AP Micro content
- ADHD mode support
- search, practice, flashcards, and test prep flows
- PDF ingestion scaffolding and local database-backed persistence

## License / Content

This codebase is for the app implementation. Source textbooks and course PDFs should be supplied locally by the user and handled according to their original licensing terms.
