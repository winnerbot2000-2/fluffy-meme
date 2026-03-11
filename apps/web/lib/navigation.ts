import type { SidebarItem } from "@apmicro/ui";

export const sidebarItems: SidebarItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Focus overview, streaks, and recommended next steps.",
  },
  {
    href: "/graph-lab",
    label: "Graph Lab",
    description: "Interactive AP Micro graph modules and compare mode.",
  },
  {
    href: "/topics",
    label: "Topics",
    description: "Unit-by-unit concept pages merged across sources.",
  },
  {
    href: "/practice",
    label: "Practice",
    description: "MCQ, FRQ, graph drills, and flashcards.",
  },
  {
    href: "/flashcards",
    label: "Flashcards",
    description: "Quizlet-style deck study, imports, and card-side tutor chat.",
  },
  {
    href: "/test-prep",
    label: "Test Prep",
    description: "Build a custom study guide from the topics and highlights on your test.",
  },
  {
    href: "/library",
    label: "Library",
    description: "Upload PDFs, inspect sources, and monitor ingestion.",
  },
];
