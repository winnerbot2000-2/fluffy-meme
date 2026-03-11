import type {
  DashboardOverview,
  Flashcard,
  IngestionStats,
  Note,
  PracticeAttempt,
  PracticeQuestion,
  ProgressTracking,
  ReviewItem,
  SearchResult,
  Source,
  SourcePage,
  SourceSelectionAssistResponse,
  TopicReference,
  TutorSession,
} from "@apmicro/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function mapSource(source: any): Source {
  return {
    id: source.id,
    title: source.title,
    shortTitle: source.short_title,
    path: source.path,
    type: source.type,
    summary: source.summary,
    tags: source.tags ?? [],
    coverage: source.coverage ?? [],
    uploadedAt: source.uploaded_at ?? FALLBACK_TIMESTAMP,
    lastProcessedAt: source.last_processed_at ?? undefined,
    author: source.author ?? undefined,
    pageCount: source.page_count ?? undefined,
  };
}

function mapTopicReference(reference: any): TopicReference {
  return {
    id: reference.id,
    sourceId: reference.source_id,
    sourceTitle: reference.source_title,
    sourceShortTitle: reference.source_short_title,
    pageNumber: reference.page_number,
    heading: reference.heading,
    excerpt: reference.excerpt,
    highlightText: reference.highlight_text ?? undefined,
  };
}

function mapProgress(progress: any): ProgressTracking {
  return {
    id: progress.id,
    topicId: progress.topic_id,
    confidence: progress.confidence,
    mastery: progress.mastery,
    lastStudiedAt: progress.last_studied_at ?? undefined,
    streakDays: progress.streak_days,
    weakSpots: progress.weak_spots ?? [],
    completedQuestionIds: progress.completed_question_ids ?? [],
  };
}

function mapFlashcard(card: any): Flashcard {
  return {
    id: card.id,
    topicId: card.topic_id,
    front: card.front,
    back: card.back,
    difficulty: card.difficulty,
    tags: card.tags ?? [],
    dueAt: card.due_at ?? undefined,
    intervalDays: card.interval_days ?? undefined,
    easeFactor: card.ease_factor ?? undefined,
    reviewCount: card.review_count ?? undefined,
    lastReviewedAt: card.last_reviewed_at ?? undefined,
  };
}

function mapQuestion(question: any): PracticeQuestion {
  return {
    id: question.id,
    topicId: question.topic_id,
    unitId: question.unit_id ?? undefined,
    type: question.type,
    origin: question.origin ?? "ap-like",
    stem: question.stem,
    prompt: question.prompt ?? undefined,
    choices: question.choices ?? undefined,
    answer: question.answer,
    explanation: question.explanation,
    trap: question.trap ?? undefined,
    difficulty: question.difficulty,
    sourceIds: question.source_ids ?? [],
    rubric: question.rubric ?? [],
    graphInteraction: question.graph_interaction
      ? {
          moduleId: question.graph_interaction.module_id,
          prompt: question.graph_interaction.prompt,
          targetType: question.graph_interaction.target_type,
          targetId: question.graph_interaction.target_id,
          targetLabel: question.graph_interaction.target_label ?? undefined,
        }
      : undefined,
  };
}

function mapNote(note: any): Note {
  return {
    id: note.id,
    topicId: note.topic_id,
    title: note.title,
    body: note.body,
    pinnedGraphId: note.pinned_graph_id ?? undefined,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

function mapTutorSession(session: any): TutorSession {
  return {
    id: session.id,
    topicId: session.topic_id ?? undefined,
    graphId: session.graph_id ?? undefined,
    mode: session.mode,
    messages: (session.messages ?? []).map((message: any) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.created_at,
    })),
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

function mapReviewItem(item: any): ReviewItem {
  return {
    id: item.id,
    itemType: item.item_type,
    itemId: item.item_id,
    topicId: item.topic_id,
    dueAt: item.due_at,
    priority: item.priority,
    reason: item.reason,
    completed: item.completed,
  };
}

export async function fetchDashboardOverview(focusTopicId?: string): Promise<DashboardOverview> {
  const query = focusTopicId ? `?focus_topic_id=${encodeURIComponent(focusTopicId)}` : "";
  const data = await request<any>(`/api/dashboard/overview${query}`);
  return {
    focusTopicId: data.focus_topic_id ?? undefined,
    recommendedNextTopicId: data.recommended_next_topic_id ?? undefined,
    sources: (data.sources ?? []).map(mapSource),
    progress: (data.progress ?? []).map(mapProgress),
    dueReviews: (data.due_reviews ?? []).map(mapReviewItem),
    weakTopicIds: data.weak_topic_ids ?? [],
  };
}

export async function fetchSources(): Promise<Source[]> {
  return (await request<any[]>("/api/sources")).map(mapSource);
}

export type ApiTopicBundle = {
  id: string;
  unitId?: string;
  topicSlug: string;
  title: string;
  summary: string;
  sourceIds: string[];
  chunkIds: string[];
  explanationVariants: string[];
  graphMentions: string[];
  formulaMentions: string[];
};

function mapApiTopicBundle(topic: any): ApiTopicBundle {
  return {
    id: topic.id,
    unitId: topic.unit_id ?? undefined,
    topicSlug: topic.topic_slug,
    title: topic.title,
    summary: topic.summary,
    sourceIds: topic.source_ids ?? [],
    chunkIds: topic.chunk_ids ?? [],
    explanationVariants: topic.explanation_variants ?? [],
    graphMentions: topic.graph_mentions ?? [],
    formulaMentions: topic.formula_mentions ?? [],
  };
}

export async function fetchTopicBundles(): Promise<ApiTopicBundle[]> {
  return (await request<any[]>("/api/topics")).map(mapApiTopicBundle);
}

export async function fetchTopicBundle(slug: string): Promise<ApiTopicBundle> {
  return mapApiTopicBundle(await request<any>(`/api/topics/${encodeURIComponent(slug)}`));
}

export async function fetchTopicReferences(slug: string): Promise<TopicReference[]> {
  return (await request<any[]>(`/api/topics/${encodeURIComponent(slug)}/references`)).map(mapTopicReference);
}

export async function fetchIngestionStats(): Promise<IngestionStats> {
  const data = await request<any>("/api/sources/stats");
  return {
    sourceCount: data.source_count,
    topicCount: data.topic_count,
    chunkCount: data.chunk_count,
    latestProcessedAt: data.latest_processed_at ?? undefined,
  };
}

export async function fetchSourcePage(sourceId: string, pageNumber: number, highlight?: string): Promise<SourcePage> {
  const params = new URLSearchParams();
  if (highlight) {
    params.set("highlight", highlight);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await request<any>(`/api/sources/${encodeURIComponent(sourceId)}/page/${pageNumber}${query}`);
  return {
    source: mapSource(data.source),
    pageNumber: data.page_number,
    totalPages: data.total_pages,
    heading: data.heading ?? undefined,
    lines: (data.lines ?? []).map((line: any) => ({
      index: line.index,
      text: line.text,
      highlighted: line.highlighted,
    })),
    highlightText: data.highlight_text ?? undefined,
  };
}

export function getSourcePdfUrl(sourceId: string, pageNumber?: number): string {
  const hash = pageNumber ? `#page=${pageNumber}` : "";
  return `${API_BASE_URL}/api/sources/${encodeURIComponent(sourceId)}/pdf${hash}`;
}

export async function assistSourceSelection(payload: {
  text: string;
  action: "summarize" | "explain-simple" | "link-to-apmicro" | "tutor-help";
  sourceId?: string;
  pageNumber?: number;
  topicSlug?: string;
}): Promise<SourceSelectionAssistResponse> {
  const data = await request<any>("/api/sources/assist", {
    method: "POST",
    body: JSON.stringify({
      text: payload.text,
      action: payload.action,
      source_id: payload.sourceId,
      page_number: payload.pageNumber,
      topic_slug: payload.topicSlug,
    }),
  });

  return {
    title: data.title,
    response: data.response,
    citations: (data.citations ?? []).map(mapTopicReference),
  };
}

export async function fetchPracticeQuestions(filters?: {
  topicId?: string;
  unitId?: string;
  questionType?: string;
  origin?: string;
}): Promise<PracticeQuestion[]> {
  const params = new URLSearchParams();
  if (filters?.topicId) {
    params.set("topic_id", filters.topicId);
  }
  if (filters?.unitId) {
    params.set("unit_id", filters.unitId);
  }
  if (filters?.questionType) {
    params.set("question_type", filters.questionType);
  }
  if (filters?.origin) {
    params.set("origin", filters.origin);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return (await request<any[]>(`/api/practice/questions${query}`)).map(mapQuestion);
}

export async function submitPracticeAttempt(payload: {
  questionId: string;
  topicId: string;
  answer: string;
  confidence: number;
  mode?: string;
  durationSeconds?: number;
}): Promise<PracticeAttempt> {
  const data = await request<any>("/api/practice/attempts", {
    method: "POST",
    body: JSON.stringify({
      question_id: payload.questionId,
      topic_id: payload.topicId,
      answer: payload.answer,
      confidence: payload.confidence,
      mode: payload.mode ?? "standard",
      duration_seconds: payload.durationSeconds,
    }),
  });
  return {
    id: data.id,
    questionId: data.question_id,
    topicId: data.topic_id,
    mode: data.mode,
    answer: data.answer,
    correct: data.correct,
    confidence: data.confidence,
    durationSeconds: data.duration_seconds ?? undefined,
    createdAt: data.created_at,
  };
}

export async function fetchFlashcards(topicId?: string, dueOnly = false): Promise<Flashcard[]> {
  const params = new URLSearchParams();
  if (topicId) {
    params.set("topic_id", topicId);
  }
  if (dueOnly) {
    params.set("due_only", "true");
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return (await request<any[]>(`/api/practice/flashcards${query}`)).map(mapFlashcard);
}

export async function importFlashcards(payload: {
  topicId?: string;
  rawText: string;
  source?: "quizlet" | "manual";
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
}): Promise<{ importedCount: number; flashcards: Flashcard[] }> {
  const data = await request<any>("/api/practice/flashcards/import", {
    method: "POST",
    body: JSON.stringify({
      topic_id: payload.topicId,
      raw_text: payload.rawText,
      source: payload.source ?? "quizlet",
      difficulty: payload.difficulty ?? "medium",
      tags: payload.tags ?? [],
    }),
  });

  return {
    importedCount: data.imported_count,
    flashcards: (data.flashcards ?? []).map(mapFlashcard),
  };
}

export async function reviewFlashcard(flashcardId: string, confidence: number): Promise<Flashcard> {
  const data = await request<any>("/api/practice/flashcards/review", {
    method: "POST",
    body: JSON.stringify({
      flashcard_id: flashcardId,
      confidence,
    }),
  });
  return mapFlashcard(data);
}

export async function fetchProgress(): Promise<ProgressTracking[]> {
  return (await request<any[]>("/api/progress")).map(mapProgress);
}

export async function fetchReviewQueue(): Promise<ReviewItem[]> {
  return (await request<any[]>("/api/progress/review-queue")).map(mapReviewItem);
}

export async function completeReviewItem(reviewId: string): Promise<ReviewItem> {
  return mapReviewItem(await request<any>(`/api/progress/review-queue/${reviewId}/complete`, { method: "POST" }));
}

export async function fetchNotes(topicId: string): Promise<Note[]> {
  return (await request<any[]>(`/api/notes?topic_id=${encodeURIComponent(topicId)}`)).map(mapNote);
}

export async function saveNote(topicId: string, payload: { title: string; body: string; pinnedGraphId?: string; bookmarked?: boolean }, noteId?: string): Promise<Note> {
  const query = noteId ? `?note_id=${encodeURIComponent(noteId)}` : "";
  return mapNote(
    await request<any>(`/api/notes/${encodeURIComponent(topicId)}${query}`, {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        pinned_graph_id: payload.pinnedGraphId,
        bookmarked: payload.bookmarked ?? false,
      }),
    }),
  );
}

export async function fetchTutorSessions(topicId?: string, graphId?: string): Promise<TutorSession[]> {
  const params = new URLSearchParams();
  if (topicId) {
    params.set("topic_id", topicId);
  }
  if (graphId) {
    params.set("graph_id", graphId);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return (await request<any[]>(`/api/tutor/sessions${query}`)).map(mapTutorSession);
}

export async function createTutorSession(payload: { topicId?: string; graphId?: string; mode?: string; graphState?: Record<string, unknown> }): Promise<TutorSession> {
  return mapTutorSession(
    await request<any>("/api/tutor/sessions", {
      method: "POST",
      body: JSON.stringify({
        topic_id: payload.topicId,
        graph_id: payload.graphId,
        mode: payload.mode ?? "tutor",
        graph_state: payload.graphState,
      }),
    }),
  );
}

export async function sendTutorMessage(sessionId: string, payload: { content: string; graphContext?: Record<string, unknown> }): Promise<TutorSession> {
  return mapTutorSession(
    await request<any>(`/api/tutor/sessions/${encodeURIComponent(sessionId)}/messages`, {
      method: "POST",
      body: JSON.stringify({
        content: payload.content,
        graph_context: payload.graphContext,
      }),
    }),
  );
}

export async function searchApi(query: string): Promise<SearchResult[]> {
  const data = await request<any[]>(`/api/search?query=${encodeURIComponent(query)}`);
  return data.map((result) => ({
    id: result.id,
    kind: result.kind,
    title: result.title,
    summary: result.summary,
    href: result.kind === "topic" ? `/topic/${result.id.replace(/^topic-/, "")}` : "/topics",
    sourceIds: result.source_ids ?? [],
  }));
}
