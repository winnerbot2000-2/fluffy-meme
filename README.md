# AP Microeconomics AI Study Guide Platform

Monorepo for a premium AP Microeconomics study platform with:

- `apps/web`: Next.js frontend with a premium dark UI, graph lab, topic pages, and study modes
- `apps/api`: FastAPI backend with database-backed PDF ingestion, topic merging, practice/review state, notes, and tutor sessions
- `packages/ui`: reusable premium UI components
- `packages/graph-engine`: reusable SVG graph engine for AP Microeconomics diagrams
- `packages/shared-types`: shared schemas and types
- `packages/content-core`: seeded AP Microeconomics curriculum data and helpers

## Quick Start

```bash
npm install
python -m pip install -r apps/api/requirements.txt
npm run dev
```

Frontend: `http://localhost:3000`

Backend docs: `http://127.0.0.1:8000/docs`

## Current Backend Capabilities

- Bootstraps the three configured AP Micro PDFs into the database on first startup
- Persists merged topic bundles, chunks, notes, tutor sessions, progress, practice attempts, and flashcard review scheduling
- Exposes dashboard, search, upload, topic, notes, practice, progress, review queue, and tutor APIs
