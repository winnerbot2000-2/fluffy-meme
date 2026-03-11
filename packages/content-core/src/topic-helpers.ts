import { formulas, practiceQuestions, sources, topics, units } from "./seed";

export function getTopicBySlug(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}

export function getTopicBundle(slug: string) {
  const topic = getTopicBySlug(slug);
  if (!topic) {
    return null;
  }

  return {
    topic,
    unit: units.find((unit) => unit.id === topic.unitId),
    formulas: formulas.filter((formula) => topic.formulaIds.includes(formula.id)),
    sources: sources.filter((source) => topic.sourceIds.includes(source.id)),
    practice: practiceQuestions.filter((question) => question.topicId === topic.id),
  };
}
