import { z } from "zod";

export const studyModeSchema = z.enum([
  "standard",
  "adhd",
  "visual",
  "exam",
  "tutor",
  "speed-review",
]);

export type StudyMode = z.infer<typeof studyModeSchema>;

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  shortTitle: z.string(),
  author: z.string().optional(),
  path: z.string(),
  type: z.enum(["textbook", "course-guide", "packet", "notes"]),
  pageCount: z.number().optional(),
  summary: z.string(),
  tags: z.array(z.string()),
  coverage: z.array(z.string()),
  uploadedAt: z.string(),
  lastProcessedAt: z.string().optional(),
});

export type Source = z.infer<typeof sourceSchema>;

export const topicReferenceSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  sourceTitle: z.string(),
  sourceShortTitle: z.string(),
  pageNumber: z.number(),
  heading: z.string(),
  excerpt: z.string(),
  highlightText: z.string().optional(),
});

export type TopicReference = z.infer<typeof topicReferenceSchema>;

export const sourcePageLineSchema = z.object({
  index: z.number(),
  text: z.string(),
  highlighted: z.boolean().default(false),
});

export const sourcePageSchema = z.object({
  source: sourceSchema,
  pageNumber: z.number(),
  totalPages: z.number(),
  heading: z.string().optional(),
  lines: z.array(sourcePageLineSchema),
  highlightText: z.string().optional(),
});

export type SourcePage = z.infer<typeof sourcePageSchema>;

export const sourceSelectionAssistResponseSchema = z.object({
  title: z.string(),
  response: z.string(),
  citations: z.array(topicReferenceSchema),
});

export type SourceSelectionAssistResponse = z.infer<typeof sourceSelectionAssistResponseSchema>;

export const formulaSchema = z.object({
  id: z.string(),
  label: z.string(),
  expression: z.string(),
  description: z.string(),
  variables: z.array(
    z.object({
      name: z.string(),
      meaning: z.string(),
    }),
  ),
  apTip: z.string(),
  topicIds: z.array(z.string()),
});

export type Formula = z.infer<typeof formulaSchema>;

export const graphPointSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  color: z.string().optional(),
  description: z.string(),
  math: z.string(),
  intuition: z.string(),
});

export type GraphPoint = z.infer<typeof graphPointSchema>;

export const shadedAreaSchema = z.object({
  id: z.string(),
  label: z.string(),
  fill: z.string(),
  description: z.string(),
  math: z.string(),
  intuition: z.string(),
  pointIds: z.array(z.string()),
});

export type ShadedArea = z.infer<typeof shadedAreaSchema>;

export const graphCurveSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["line", "curve", "ppc", "step"]),
  color: z.string(),
  formula: z.string(),
  draggable: z.boolean().default(false),
});

export type GraphCurve = z.infer<typeof graphCurveSchema>;

export const graphModelSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum([
    "supply-demand",
    "tax",
    "subsidy",
    "ppc",
    "monopoly",
    "cost-curves",
    "factor-market",
    "externality",
  ]),
  xAxisLabel: z.string(),
  yAxisLabel: z.string(),
  curves: z.array(graphCurveSchema),
  points: z.array(graphPointSchema),
  shadedAreas: z.array(shadedAreaSchema),
  formulas: z.array(z.string()),
  trapWarnings: z.array(z.string()),
});

export type GraphModel = z.infer<typeof graphModelSchema>;

export const flashcardSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  front: z.string(),
  back: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()),
  dueAt: z.string().optional(),
  intervalDays: z.number().optional(),
  easeFactor: z.number().optional(),
  reviewCount: z.number().optional(),
  lastReviewedAt: z.string().optional(),
});

export type Flashcard = z.infer<typeof flashcardSchema>;

export const questionOriginSchema = z.enum(["official", "ap-like"]);

export const graphInteractionSchema = z.object({
  moduleId: z.string(),
  prompt: z.string(),
  targetType: z.enum(["point", "area"]),
  targetId: z.string(),
  targetLabel: z.string().optional(),
});

export type QuestionOrigin = z.infer<typeof questionOriginSchema>;
export type GraphInteraction = z.infer<typeof graphInteractionSchema>;

export const practiceQuestionSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  unitId: z.string().optional(),
  type: z.enum(["mcq", "frq", "graph", "formula"]),
  origin: questionOriginSchema.default("ap-like"),
  stem: z.string(),
  prompt: z.string().optional(),
  choices: z.array(z.string()).optional(),
  answer: z.string(),
  explanation: z.string(),
  trap: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  sourceIds: z.array(z.string()),
  rubric: z.array(z.string()).default([]),
  graphInteraction: graphInteractionSchema.optional(),
});

export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;

export const noteSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  title: z.string(),
  body: z.string(),
  pinnedGraphId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Note = z.infer<typeof noteSchema>;

export const tutorMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  createdAt: z.string(),
});

export const tutorSessionSchema = z.object({
  id: z.string(),
  topicId: z.string().optional(),
  graphId: z.string().optional(),
  mode: studyModeSchema,
  messages: z.array(tutorMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TutorSession = z.infer<typeof tutorSessionSchema>;

export const progressTrackingSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  confidence: z.number().min(0).max(100),
  mastery: z.number().min(0).max(100),
  lastStudiedAt: z.string().optional(),
  streakDays: z.number().default(0),
  weakSpots: z.array(z.string()),
  completedQuestionIds: z.array(z.string()),
});

export type ProgressTracking = z.infer<typeof progressTrackingSchema>;

export const practiceAttemptSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  topicId: z.string(),
  mode: z.string(),
  answer: z.string(),
  correct: z.boolean(),
  confidence: z.number().min(0).max(100),
  durationSeconds: z.number().optional(),
  createdAt: z.string(),
});

export type PracticeAttempt = z.infer<typeof practiceAttemptSchema>;

export const reviewItemSchema = z.object({
  id: z.string(),
  itemType: z.string(),
  itemId: z.string(),
  topicId: z.string(),
  dueAt: z.string(),
  priority: z.number(),
  reason: z.string(),
  completed: z.boolean(),
});

export type ReviewItem = z.infer<typeof reviewItemSchema>;

export const dashboardOverviewSchema = z.object({
  focusTopicId: z.string().optional(),
  recommendedNextTopicId: z.string().optional(),
  sources: z.array(sourceSchema),
  progress: z.array(progressTrackingSchema),
  dueReviews: z.array(reviewItemSchema),
  weakTopicIds: z.array(z.string()),
});

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;

export const ingestionStatsSchema = z.object({
  sourceCount: z.number(),
  topicCount: z.number(),
  chunkCount: z.number(),
  latestProcessedAt: z.string().optional(),
});

export type IngestionStats = z.infer<typeof ingestionStatsSchema>;

export const topicSchema = z.object({
  id: z.string(),
  slug: z.string(),
  unitId: z.string(),
  title: z.string(),
  shortDescription: z.string(),
  tenSecondMeaning: z.string(),
  whyItMatters: z.string(),
  apTrap: z.string(),
  graphIds: z.array(z.string()),
  formulaIds: z.array(z.string()),
  sourceIds: z.array(z.string()),
  keyIdeas: z.array(z.string()),
  examPhrasing: z.array(z.string()),
  visualAnchors: z.array(z.string()),
});

export type Topic = z.infer<typeof topicSchema>;

export const unitSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  examWeight: z.string(),
  description: z.string(),
  topicIds: z.array(z.string()),
});

export type Unit = z.infer<typeof unitSchema>;

export const searchResultSchema = z.object({
  id: z.string(),
  kind: z.enum(["topic", "formula", "question", "source", "graph"]),
  title: z.string(),
  summary: z.string(),
  href: z.string(),
  sourceIds: z.array(z.string()).default([]),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export const graphAnalyzerRequestSchema = z.object({
  imageUrl: z.string().optional(),
  uploadId: z.string().optional(),
  expectedGraphType: z.string().optional(),
});

export const graphAnalyzerResponseSchema = z.object({
  graphType: z.string(),
  confidence: z.number(),
  detectedAxes: z.array(z.string()),
  reconstructedGraphId: z.string().optional(),
  explanation: z.string(),
});

export type GraphAnalyzerRequest = z.infer<typeof graphAnalyzerRequestSchema>;
export type GraphAnalyzerResponse = z.infer<typeof graphAnalyzerResponseSchema>;
