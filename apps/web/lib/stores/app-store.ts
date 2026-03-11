"use client";

import type { StudyMode } from "@apmicro/shared-types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppStore = {
  studySelections: HighlightSelection[];
  testSelections: HighlightSelection[];
  testPrepTitle: string;
  testPrepDate: string;
  testTopicSlugs: string[];
  studyMode: StudyMode;
  searchOpen: boolean;
  compareMode: boolean;
  explainLike12: boolean;
  examWording: boolean;
  todaysFocusTopicId: string;
  addStudySelection: (selection: HighlightSelectionInput) => void;
  removeStudySelection: (id: string) => void;
  addTestSelection: (selection: HighlightSelectionInput) => void;
  removeTestSelection: (id: string) => void;
  clearTestSelections: () => void;
  setTestPrepTitle: (value: string) => void;
  setTestPrepDate: (value: string) => void;
  toggleTestTopicSlug: (slug: string) => void;
  setTestTopicSlugs: (slugs: string[]) => void;
  setStudyMode: (studyMode: StudyMode) => void;
  setSearchOpen: (searchOpen: boolean) => void;
  toggleCompareMode: () => void;
  toggleExplainLike12: () => void;
  toggleExamWording: () => void;
};

export type HighlightSelection = {
  id: string;
  text: string;
  topicSlug?: string;
  sourceId?: string;
  pageNumber?: number;
  createdAt: string;
};

export type HighlightSelectionInput = Omit<HighlightSelection, "id" | "createdAt">;

function makeSelection(selection: HighlightSelectionInput): HighlightSelection {
  return {
    ...selection,
    id: `selection-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      studySelections: [],
      testSelections: [],
      testPrepTitle: "AP Micro test",
      testPrepDate: "",
      testTopicSlugs: [],
      studyMode: "standard",
      searchOpen: false,
      compareMode: false,
      explainLike12: true,
      examWording: false,
      todaysFocusTopicId: "taxes-and-subsidies",
      addStudySelection: (selection) =>
        set((state) => ({
          studySelections: [makeSelection(selection), ...state.studySelections].slice(0, 24),
        })),
      removeStudySelection: (id) =>
        set((state) => ({
          studySelections: state.studySelections.filter((item) => item.id !== id),
        })),
      addTestSelection: (selection) =>
        set((state) => {
          const next = makeSelection(selection);
          const nextTopicSlugs = selection.topicSlug
            ? Array.from(new Set([...state.testTopicSlugs, selection.topicSlug]))
            : state.testTopicSlugs;
          return {
            testSelections: [next, ...state.testSelections].slice(0, 24),
            testTopicSlugs: nextTopicSlugs,
          };
        }),
      removeTestSelection: (id) =>
        set((state) => ({
          testSelections: state.testSelections.filter((item) => item.id !== id),
        })),
      clearTestSelections: () => set({ testSelections: [] }),
      setTestPrepTitle: (value) => set({ testPrepTitle: value }),
      setTestPrepDate: (value) => set({ testPrepDate: value }),
      toggleTestTopicSlug: (slug) =>
        set((state) => ({
          testTopicSlugs: state.testTopicSlugs.includes(slug)
            ? state.testTopicSlugs.filter((item) => item !== slug)
            : [...state.testTopicSlugs, slug],
        })),
      setTestTopicSlugs: (slugs) => set({ testTopicSlugs: Array.from(new Set(slugs)) }),
      setStudyMode: (studyMode) => set({ studyMode }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      toggleCompareMode: () => set((state) => ({ compareMode: !state.compareMode })),
      toggleExplainLike12: () => set((state) => ({ explainLike12: !state.explainLike12 })),
      toggleExamWording: () => set((state) => ({ examWording: !state.examWording })),
    }),
    {
      name: "apmicro-ui-store",
      partialize: (state) => ({
        studyMode: state.studyMode,
        compareMode: state.compareMode,
        explainLike12: state.explainLike12,
        examWording: state.examWording,
        todaysFocusTopicId: state.todaysFocusTopicId,
        studySelections: state.studySelections,
        testSelections: state.testSelections,
        testPrepTitle: state.testPrepTitle,
        testPrepDate: state.testPrepDate,
        testTopicSlugs: state.testTopicSlugs,
      }),
    },
  ),
);
