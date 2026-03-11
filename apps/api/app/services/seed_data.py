from __future__ import annotations

from datetime import datetime, timedelta

from app.models.schemas import FlashcardRecord, PracticeQuestionRecord, ProgressRecord, TopicBundle
from app.services.practice_bank import build_ap_like_question_bank


def seeded_practice_questions(topics: list[TopicBundle]) -> list[PracticeQuestionRecord]:
    return build_ap_like_question_bank(topics)


def seeded_flashcards() -> list[FlashcardRecord]:
    now = datetime.utcnow()
    return [
        FlashcardRecord(
            id="fc-equilibrium",
            topic_id="equilibrium",
            front="What does equilibrium mean on a supply and demand graph?",
            back="Quantity demanded equals quantity supplied, so there is no pressure for price to change.",
            difficulty="easy",
            tags=["graph", "equilibrium"],
            due_at=now - timedelta(days=1),
        ),
        FlashcardRecord(
            id="fc-tax-incidence",
            topic_id="taxes-and-subsidies",
            front="Who bears more of a tax burden?",
            back="The less elastic side of the market bears more of the tax burden.",
            difficulty="medium",
            tags=["tax", "elasticity"],
            due_at=now,
        ),
        FlashcardRecord(
            id="fc-monopoly-price",
            topic_id="monopoly",
            front="How do you find monopoly price?",
            back="Find quantity where MR = MC, then move up to the demand curve for price.",
            difficulty="easy",
            tags=["monopoly", "graph"],
            due_at=now + timedelta(days=1),
        ),
        FlashcardRecord(
            id="fc-ppc-inside",
            topic_id="ppc",
            front="What does a point inside the PPC mean?",
            back="It is attainable but productively inefficient.",
            difficulty="easy",
            tags=["ppc", "efficiency"],
            due_at=now - timedelta(hours=2),
        ),
    ]


def seeded_progress() -> list[ProgressRecord]:
    now = datetime.utcnow()
    return [
        ProgressRecord(
            id="progress-equilibrium",
            topic_id="equilibrium",
            confidence=66,
            mastery=58,
            last_studied_at=now,
            streak_days=4,
            weak_spots=["distinguishing shifts from movement along curves", "consumer surplus shading"],
            completed_question_ids=["pq-equilibrium-shift"],
        ),
        ProgressRecord(
            id="progress-tax",
            topic_id="taxes-and-subsidies",
            confidence=48,
            mastery=44,
            last_studied_at=now,
            streak_days=2,
            weak_spots=["tax incidence", "dwl math"],
            completed_question_ids=[],
        ),
        ProgressRecord(
            id="progress-monopoly",
            topic_id="monopoly",
            confidence=57,
            mastery=51,
            last_studied_at=now,
            streak_days=1,
            weak_spots=["MR = MC versus price", "profit rectangle"],
            completed_question_ids=[],
        ),
    ]
