from __future__ import annotations

from app.models.schemas import TutorMessageCreate, TutorSessionRecord


def build_tutor_reply(session: TutorSessionRecord, message: TutorMessageCreate) -> str:
    topic_line = f"Topic: {session.topic_id}." if session.topic_id else "Topic: general AP Microeconomics."
    graph_line = f"Graph: {session.graph_id}." if session.graph_id else "Graph: no graph selected."
    mode_line = f"Mode: {session.mode}."
    graph_state = ""
    if session.graph_state:
        graph_state = f" Current graph state: {session.graph_state}."

    lower = message.content.lower()
    flashcard = (message.graph_context or {}).get("flashcard") if message.graph_context else None
    if isinstance(flashcard, dict):
        front = str(flashcard.get("front", "")).strip()
        back = str(flashcard.get("back", "")).strip()
        if "quiz" in lower or "test" in lower:
            guidance = f"I'll quiz you on this card. Prompt: {front}. Reply with your own answer before flipping the card, then compare it against this anchor: {back}"
        elif "memory" in lower or "mnemonic" in lower:
            guidance = f"Memory hook: connect '{front}' to one vivid AP move or graph story, then say the answer in one sentence: {back}"
        elif "12" in lower or "simple" in lower:
            guidance = f"Simple version: {front} means {back}"
        elif "exam" in lower:
            guidance = f"Exam wording: define {front} precisely, then connect it to the AP Micro situation or graph where it changes a result. Core answer: {back}"
        else:
            guidance = f"Flashcard focus. Front: {front}. Best short answer: {back}. Use that as the anchor, then add the AP graph, formula, or market logic that makes it stick."
    elif "hint" in lower:
        guidance = "Start by naming the graph, then identify the one variable that changed first. Only after that should you calculate areas or equilibrium values."
    elif "explain" in lower and "12" in lower:
        guidance = "Use a one-sentence story first, then map that story onto the graph lines and shaded regions."
    elif "exam" in lower:
        guidance = "Use AP wording: identify the curve shift or condition, name the equilibrium effect, then justify it with the graph."
    else:
        guidance = "Anchor your answer to the graph: quantity comes first, price second, then any area math like surplus, revenue, or deadweight loss."

    return f"{topic_line} {graph_line} {mode_line}{graph_state} {guidance}"
