from __future__ import annotations

from collections.abc import Iterable

from app.models.schemas import PracticeQuestionRecord, TopicBundle
from app.services.ingestion.taxonomy import AP_TOPIC_TAXONOMY

DEFAULT_SOURCE_IDS = ["source-ced", "source-krugman", "source-kacapyr"]


def _topic_lookup(topics: Iterable[TopicBundle]) -> dict[str, TopicBundle]:
    return {topic.id: topic for topic in topics}


def _meta(topics: dict[str, TopicBundle], topic_id: str) -> tuple[str, list[str], str]:
    topic = topics.get(topic_id)
    if topic:
        return (
            topic.unit_id or AP_TOPIC_TAXONOMY.get(topic_id, {}).get("unit_id", "unit-1"),
            topic.source_ids or DEFAULT_SOURCE_IDS,
            topic.title,
        )

    taxonomy = AP_TOPIC_TAXONOMY.get(topic_id, {})
    return (
        taxonomy.get("unit_id", "unit-1"),
        DEFAULT_SOURCE_IDS,
        taxonomy.get("title", topic_id.replace("-", " ").title()),
    )


def _mcq(
    *,
    question_id: str,
    topic_id: str,
    unit_id: str,
    source_ids: list[str],
    stem: str,
    choices: list[str],
    answer: str,
    explanation: str,
    trap: str,
    difficulty: str = "medium",
) -> PracticeQuestionRecord:
    return PracticeQuestionRecord(
        id=question_id,
        topic_id=topic_id,
        unit_id=unit_id,
        type="mcq",
        origin="ap-like",
        stem=stem,
        prompt="Choose the best AP Microeconomics answer.",
        choices=choices,
        answer=answer,
        explanation=explanation,
        trap=trap,
        difficulty=difficulty,
        source_ids=source_ids,
    )


def _frq(
    *,
    question_id: str,
    topic_id: str,
    unit_id: str,
    source_ids: list[str],
    stem: str,
    prompt: str,
    answer: str,
    explanation: str,
    rubric: list[str],
    trap: str,
    difficulty: str = "hard",
) -> PracticeQuestionRecord:
    return PracticeQuestionRecord(
        id=question_id,
        topic_id=topic_id,
        unit_id=unit_id,
        type="frq",
        origin="ap-like",
        stem=stem,
        prompt=prompt,
        answer=answer,
        explanation=explanation,
        trap=trap,
        difficulty=difficulty,
        source_ids=source_ids,
        rubric=rubric,
    )


def _graph(
    *,
    question_id: str,
    topic_id: str,
    unit_id: str,
    source_ids: list[str],
    stem: str,
    prompt: str,
    explanation: str,
    trap: str,
    module_id: str,
    target_type: str,
    target_id: str,
    target_label: str,
    difficulty: str = "medium",
) -> PracticeQuestionRecord:
    return PracticeQuestionRecord(
        id=question_id,
        topic_id=topic_id,
        unit_id=unit_id,
        type="graph",
        origin="ap-like",
        stem=stem,
        prompt=prompt,
        answer=target_id,
        explanation=explanation,
        trap=trap,
        difficulty=difficulty,
        source_ids=source_ids,
        graph_interaction={
            "module_id": module_id,
            "prompt": prompt,
            "target_type": target_type,
            "target_id": target_id,
            "target_label": target_label,
        },
    )


def build_ap_like_question_bank(topics: Iterable[TopicBundle]) -> list[PracticeQuestionRecord]:
    topic_index = _topic_lookup(topics)
    question_bank: list[PracticeQuestionRecord] = []

    def add(topic_id: str, builder) -> None:
        unit_id, source_ids, _ = _meta(topic_index, topic_id)
        question_bank.append(builder(unit_id, source_ids))

    add(
        "scarcity-choice",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-scarcity-choice-1",
            topic_id="scarcity-choice",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A student has one hour before a test and can either review flashcards or finish a problem set. Which statement best describes the opportunity cost of finishing the problem set?",
            choices=[
                "The total benefit from both activities together",
                "The value of the flashcard review time that must be given up",
                "The money paid for the textbook",
                "The number of questions on the test",
            ],
            answer="The value of the flashcard review time that must be given up",
            explanation="Opportunity cost is the value of the next best alternative sacrificed when a choice is made.",
            trap="Do not define opportunity cost as any cost at all. It is specifically the highest-valued forgone alternative.",
            difficulty="easy",
        ),
    )
    add(
        "scarcity-choice",
        lambda unit_id, source_ids: _frq(
            question_id="frq-scarcity-choice-1",
            topic_id="scarcity-choice",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A city has enough land to build either a public park or a parking garage on the same parcel, but not both.",
            prompt="Define scarcity and explain the opportunity cost of choosing the parking garage. Then explain how marginal analysis should guide the city's decision.",
            answer="Scarcity means resources are limited relative to unlimited wants. The opportunity cost of the parking garage is the value of the park that is forgone. The city should compare the marginal benefit of one more unit of parking space with the marginal cost of devoting land and funds to that use.",
            explanation="A strong AP response defines scarcity, names the forgone park as the opportunity cost, and uses marginal benefit versus marginal cost as the decision rule.",
            rubric=["scarcity means limited resources", "opportunity cost is the forgone park", "compare marginal benefit and marginal cost"],
            trap="Average benefit is not the AP decision rule here. Use marginal benefit and marginal cost.",
        ),
    )

    add(
        "ppc",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-ppc-1",
            topic_id="ppc",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Moving from one point to another along a bowed-out production possibilities curve most directly shows that",
            choices=[
                "resources are equally adaptable between both goods",
                "the opportunity cost of one good changes as more of it is produced",
                "all points inside the curve are unattainable",
                "economic growth has shifted the frontier outward",
            ],
            answer="the opportunity cost of one good changes as more of it is produced",
            explanation="A bowed-out PPC reflects increasing opportunity cost as production shifts toward one good and resources are less well suited for that use.",
            trap="Do not confuse a movement along the PPC with an outward shift of the PPC.",
        ),
    )
    add(
        "ppc",
        lambda unit_id, source_ids: _frq(
            question_id="frq-ppc-1",
            topic_id="ppc",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="An economy can produce either wheat or computers. It moves from 30 computers and 60 tons of wheat to 40 computers and 45 tons of wheat.",
            prompt="Calculate the opportunity cost of one additional computer and state whether both production combinations are productively efficient.",
            answer="The economy gives up 15 tons of wheat to gain 10 computers, so the opportunity cost is 1.5 tons of wheat per computer. If both points are on the PPC, both are productively efficient.",
            explanation="Opportunity cost equals what is given up divided by what is gained in the requested direction.",
            rubric=["15 tons of wheat forgone", "10 computers gained", "1.5 tons of wheat per computer", "points on PPC are efficient"],
            trap="Use the good forgone in the numerator and the good gained in the denominator because the question asks for the cost of a computer.",
        ),
    )
    add(
        "ppc",
        lambda unit_id, source_ids: _graph(
            question_id="graph-ppc-inside-point",
            topic_id="ppc",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="On the PPC, click the point that is attainable but productively inefficient.",
            prompt="Click the point that is inside the frontier.",
            explanation="A point inside the PPC is attainable but inefficient because the economy is not using all resources fully.",
            trap="Do not click a point on the curve. Those points are efficient, not inefficient.",
            module_id="ppc",
            target_type="point",
            target_id="inside",
            target_label="Inside",
            difficulty="easy",
        ),
    )

    add(
        "comparative-advantage",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-comparative-advantage-1",
            topic_id="comparative-advantage",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Country A can produce 10 shirts or 5 pairs of shoes in a day. Country B can produce 8 shirts or 8 pairs of shoes. Which statement is correct?",
            choices=[
                "Country A has a comparative advantage in shoes",
                "Country B has a comparative advantage in shoes",
                "Country A has an absolute advantage in both goods",
                "Country B has a comparative advantage in both goods",
            ],
            answer="Country B has a comparative advantage in shoes",
            explanation="Country A gives up 2 shirts per pair of shoes, while Country B gives up 1 shirt per pair of shoes, so B has the lower opportunity cost in shoes.",
            trap="Comparative advantage is based on lower opportunity cost, not higher output alone.",
        ),
    )
    add(
        "comparative-advantage",
        lambda unit_id, source_ids: _frq(
            question_id="frq-comparative-advantage-1",
            topic_id="comparative-advantage",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Two workers, Ana and Ben, can each make only pizzas or salads in one hour. Ana can make 6 pizzas or 12 salads. Ben can make 4 pizzas or 4 salads.",
            prompt="Identify which worker has the comparative advantage in pizzas and suggest a mutually beneficial terms-of-trade range in salads per pizza.",
            answer="Ana has the comparative advantage in pizzas because her opportunity cost is 2 salads per pizza, while Ben's is 1 salad per pizza, so Ben has the comparative advantage in salads. A mutually beneficial terms-of-trade range is between 1 and 2 salads per pizza.",
            explanation="Terms of trade must fall between the two workers' opportunity costs for both to gain from specialization and exchange.",
            rubric=["ana cost 2 salads per pizza", "ben cost 1 salad per pizza", "ben has comparative advantage in salads", "terms of trade between 1 and 2 salads per pizza"],
            trap="Check the direction of the opportunity-cost ratio before naming the comparative advantage.",
        ),
    )

    add(
        "economic-systems",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-economic-systems-1",
            topic_id="economic-systems",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Which economic system relies most heavily on prices, profits, and losses to allocate resources?",
            choices=[
                "A market economy",
                "A command economy",
                "A traditional economy",
                "A barter economy",
            ],
            answer="A market economy",
            explanation="Market economies use decentralized price signals to coordinate production and consumption decisions.",
            trap="A mixed economy still uses markets, but a pure command economy does not allocate mainly through prices.",
            difficulty="easy",
        ),
    )
    add(
        "economic-systems",
        lambda unit_id, source_ids: _frq(
            question_id="frq-economic-systems-1",
            topic_id="economic-systems",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A government fixes production targets for steel, bread, and housing while private markets set prices for restaurant meals and clothing.",
            prompt="Explain why this economy is mixed rather than purely command or purely market-based, and identify one likely tradeoff of the arrangement.",
            answer="This economy is mixed because some resources are allocated by government planning while others are allocated through markets. One tradeoff is that the government can target social goals more directly, but it may also reduce efficiency or responsiveness in the planned sectors.",
            explanation="A mixed economy combines market signals with government direction instead of using only one coordination mechanism.",
            rubric=["both planning and markets are present", "therefore economy is mixed", "mentions a tradeoff such as equity versus efficiency or responsiveness"],
            trap="Do not classify the whole system from one sector alone. The question explicitly describes both market and command elements.",
        ),
    )

    add(
        "equilibrium",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-equilibrium-1",
            topic_id="equilibrium",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="If the current market price is above equilibrium, which outcome will occur in a competitive market?",
            choices=[
                "A shortage will cause price to rise further",
                "A surplus will put downward pressure on price",
                "Demand will shift right until price stays high",
                "Supply will shift left until quantity demanded increases",
            ],
            answer="A surplus will put downward pressure on price",
            explanation="At a price above equilibrium, quantity supplied exceeds quantity demanded, creating a surplus and downward pressure on price.",
            trap="A surplus is not the same thing as high demand. It means sellers are offering more than buyers want at that price.",
            difficulty="easy",
        ),
    )
    add(
        "equilibrium",
        lambda unit_id, source_ids: _frq(
            question_id="frq-equilibrium-1",
            topic_id="equilibrium",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="The market for coffee is initially in equilibrium. Consumer incomes rise, and coffee is a normal good.",
            prompt="Explain what happens to demand, equilibrium price, and equilibrium quantity if supply is unchanged.",
            answer="Demand increases because coffee is a normal good. The demand curve shifts right, so equilibrium price rises and equilibrium quantity rises.",
            explanation="With unchanged supply, a rightward shift of demand moves the intersection up and to the right.",
            rubric=["demand increases or shifts right", "equilibrium price rises", "equilibrium quantity rises"],
            trap="The entire demand curve shifts. This is not a movement along the existing demand curve.",
            difficulty="medium",
        ),
    )
    add(
        "equilibrium",
        lambda unit_id, source_ids: _graph(
            question_id="graph-equilibrium-point",
            topic_id="equilibrium",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Click the market-clearing point on the graph.",
            prompt="Click the equilibrium point where quantity demanded equals quantity supplied.",
            explanation="The equilibrium point is the intersection of the demand and supply curves.",
            trap="Do not click either axis intercept. The market-clearing point is the intersection of both curves.",
            module_id="supply-demand-equilibrium",
            target_type="point",
            target_id="equilibrium",
            target_label="E",
            difficulty="easy",
        ),
    )

    add(
        "demand-supply-shifts",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-demand-supply-shifts-1",
            topic_id="demand-supply-shifts",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A fall in the price of the good itself causes which change?",
            choices=[
                "A decrease in demand",
                "An increase in demand",
                "A decrease in quantity demanded",
                "An increase in quantity demanded",
            ],
            answer="An increase in quantity demanded",
            explanation="A change in the good's own price causes movement along the demand curve, not a shift of the entire curve.",
            trap="Save the word demand for curve shifts caused by income, tastes, expectations, and related factors.",
            difficulty="easy",
        ),
    )
    add(
        "demand-supply-shifts",
        lambda unit_id, source_ids: _frq(
            question_id="frq-demand-supply-shifts-1",
            topic_id="demand-supply-shifts",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="The price of steel rises, increasing production costs for automobiles.",
            prompt="Explain what happens to the supply of automobiles and the resulting equilibrium price and quantity if demand is unchanged.",
            answer="The supply of automobiles decreases because input costs rise. The supply curve shifts left, equilibrium price rises, and equilibrium quantity falls.",
            explanation="Higher production costs shift supply left and move the market to a higher price and lower quantity when demand is unchanged.",
            rubric=["supply decreases or shifts left", "equilibrium price rises", "equilibrium quantity falls"],
            trap="Do not call this a decrease in quantity supplied. Production costs shift the supply curve itself.",
            difficulty="medium",
        ),
    )

    add(
        "elasticity",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-elasticity-1",
            topic_id="elasticity",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="If demand is elastic over a price range, a decrease in price will most likely",
            choices=[
                "decrease total revenue",
                "increase total revenue",
                "leave total revenue unchanged",
                "increase total cost",
            ],
            answer="increase total revenue",
            explanation="With elastic demand, the percentage increase in quantity demanded is larger than the percentage decrease in price, so total revenue rises when price falls.",
            trap="Total revenue relationships depend on elasticity, not on price changes alone.",
        ),
    )
    add(
        "elasticity",
        lambda unit_id, source_ids: _frq(
            question_id="frq-elasticity-1",
            topic_id="elasticity",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Price rises from $8 to $10 and quantity demanded falls from 110 to 90.",
            prompt="Use the midpoint formula to calculate the price elasticity of demand and classify demand as elastic, inelastic, or unit elastic.",
            answer="Elasticity is about 0.84, so demand is inelastic.",
            explanation="The midpoint percentage change in quantity is 20 divided by 100, and the midpoint percentage change in price is 2 divided by 9. Dividing gives about 0.84.",
            rubric=["quantity change 20 over midpoint 100", "price change 2 over midpoint 9", "elasticity about 0.84", "inelastic"],
            trap="Do not divide by the original quantity or original price. The midpoint formula uses averages.",
            difficulty="medium",
        ),
    )

    add(
        "taxes-and-subsidies",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-taxes-and-subsidies-1",
            topic_id="taxes-and-subsidies",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="When a per-unit tax is placed on a competitive market, deadweight loss arises because the tax",
            choices=[
                "raises producer surplus above the efficient level",
                "causes the market quantity to fall below the efficient quantity",
                "guarantees consumers pay the entire tax burden",
                "eliminates all government revenue",
            ],
            answer="causes the market quantity to fall below the efficient quantity",
            explanation="A tax reduces quantity below the efficient level, so some mutually beneficial trades no longer occur.",
            trap="Tax revenue still exists. Deadweight loss is the value of lost trades, not the rectangle the government collects.",
        ),
    )
    add(
        "taxes-and-subsidies",
        lambda unit_id, source_ids: _frq(
            question_id="frq-taxes-and-subsidies-1",
            topic_id="taxes-and-subsidies",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A market has an original equilibrium quantity of 90 units. A $5 per-unit tax reduces the quantity sold to 70 units.",
            prompt="Calculate tax revenue and deadweight loss.",
            answer="Tax revenue is $350 and deadweight loss is $50.",
            explanation="Revenue is the tax per unit times the after-tax quantity: 5 x 70 = 350. Deadweight loss is 0.5 x 20 x 5 = 50.",
            rubric=["tax revenue 350", "deadweight loss 50", "uses after-tax quantity for revenue"],
            trap="Use the after-tax quantity for tax revenue. The original quantity is used only to find the deadweight-loss base.",
        ),
    )
    add(
        "taxes-and-subsidies",
        lambda unit_id, source_ids: _graph(
            question_id="graph-tax-revenue-area",
            topic_id="taxes-and-subsidies",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="On the tax graph, click the government revenue area.",
            prompt="Click the tax revenue rectangle.",
            explanation="Tax revenue is the rectangle formed by the tax wedge times the after-tax quantity.",
            trap="Do not click the pink deadweight loss triangle. The government revenue area is the rectangle between buyer price and seller price.",
            module_id="tax-market",
            target_type="area",
            target_id="tax-revenue",
            target_label="Tax Revenue",
        ),
    )
    add(
        "taxes-and-subsidies",
        lambda unit_id, source_ids: _graph(
            question_id="graph-subsidy-cost-area",
            topic_id="taxes-and-subsidies",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="On the subsidy graph, click the government spending area.",
            prompt="Click the government cost rectangle created by the subsidy.",
            explanation="Government subsidy cost is the rectangle equal to the subsidy per unit times the subsidized quantity.",
            trap="Do not click the deadweight-loss triangle. Government cost is the green rectangle.",
            module_id="subsidy-market",
            target_type="area",
            target_id="subsidy-cost",
            target_label="Government Cost",
        ),
    )

    add(
        "price-controls",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-price-controls-1",
            topic_id="price-controls",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A binding price ceiling set below equilibrium will create",
            choices=[
                "a surplus because sellers want to produce more",
                "a shortage because quantity demanded exceeds quantity supplied",
                "no change because ceilings are nonbinding by definition",
                "an increase in producer surplus for all sellers",
            ],
            answer="a shortage because quantity demanded exceeds quantity supplied",
            explanation="A binding ceiling below equilibrium keeps price too low, so buyers demand more than sellers supply.",
            trap="Below equilibrium means shortage, not surplus.",
            difficulty="easy",
        ),
    )
    add(
        "price-controls",
        lambda unit_id, source_ids: _frq(
            question_id="frq-price-controls-1",
            topic_id="price-controls",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="The equilibrium rent for apartments is $1,600, but the government sets a maximum legal rent of $1,200.",
            prompt="Explain whether the price ceiling is binding and describe the resulting market outcome.",
            answer="The ceiling is binding because it is below equilibrium. It creates a shortage because quantity demanded rises while quantity supplied falls at the lower rent.",
            explanation="A binding ceiling below equilibrium prevents the price from adjusting to the market-clearing level.",
            rubric=["binding because below equilibrium", "shortage", "quantity demanded rises", "quantity supplied falls"],
            trap="Do not say the ceiling creates a surplus. A low legal price creates excess demand.",
        ),
    )

    add(
        "trade-policy",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-trade-policy-1",
            topic_id="trade-policy",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="If the world price of a good is below the domestic equilibrium price, opening to trade will cause the country to",
            choices=[
                "import the good",
                "export the good",
                "become completely self-sufficient",
                "set domestic quantity demanded equal to zero",
            ],
            answer="import the good",
            explanation="If the world price is lower than the domestic price, domestic consumers buy more and domestic producers sell less, so imports fill the gap.",
            trap="A lower world price makes the country an importer, not an exporter.",
        ),
    )
    add(
        "trade-policy",
        lambda unit_id, source_ids: _frq(
            question_id="frq-trade-policy-1",
            topic_id="trade-policy",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A country imports sugar at the world price. The government then places a tariff on imported sugar.",
            prompt="Explain the effect of the tariff on domestic price, domestic production, domestic consumption, and imports.",
            answer="The tariff raises the domestic price. Domestic production increases, domestic consumption decreases, and imports fall.",
            explanation="The tariff pushes the domestic price above the world price and reduces trade volume.",
            rubric=["domestic price rises", "domestic production rises", "domestic consumption falls", "imports fall"],
            trap="A tariff does not lower the domestic price. It raises the price paid by domestic consumers.",
        ),
    )

    add(
        "cost-curves",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-cost-curves-1",
            topic_id="cost-curves",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Which cost is zero when output is zero in the short run?",
            choices=[
                "Fixed cost",
                "Variable cost",
                "Average total cost",
                "Average fixed cost",
            ],
            answer="Variable cost",
            explanation="Variable costs depend on output, so they are zero when the firm produces nothing. Fixed costs remain.",
            trap="Fixed costs do not disappear when output is zero in the short run.",
            difficulty="easy",
        ),
    )
    add(
        "cost-curves",
        lambda unit_id, source_ids: _frq(
            question_id="frq-cost-curves-1",
            topic_id="cost-curves",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A firm's total cost rises from $140 to $188 when output increases from 12 units to 16 units.",
            prompt="Calculate marginal cost over this output range and explain what marginal cost measures.",
            answer="Marginal cost is $12 per unit because total cost rises by $48 over 4 additional units. Marginal cost measures the additional cost of producing one more unit of output.",
            explanation="Marginal cost equals change in total cost divided by change in output.",
            rubric=["change in total cost 48", "change in output 4", "marginal cost 12", "cost of one more unit"],
            trap="Use the change in total cost, not total cost itself.",
            difficulty="medium",
        ),
    )

    add(
        "production-functions",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-production-functions-1",
            topic_id="production-functions",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Diminishing marginal returns begin when",
            choices=[
                "total product becomes negative",
                "marginal product starts to fall while remaining positive",
                "average product is greater than marginal product",
                "fixed cost becomes variable cost",
            ],
            answer="marginal product starts to fall while remaining positive",
            explanation="Diminishing marginal returns means each additional worker adds less extra output than the previous worker, even if total output is still rising.",
            trap="Marginal product does not need to become negative for diminishing returns to begin.",
        ),
    )
    add(
        "production-functions",
        lambda unit_id, source_ids: _frq(
            question_id="frq-production-functions-1",
            topic_id="production-functions",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A bakery hires workers one at a time. As the fourth, fifth, and sixth workers are added, total output continues to rise but the extra output from each new worker gets smaller.",
            prompt="Identify the production concept illustrated and explain why it occurs in the short run.",
            answer="The bakery is experiencing diminishing marginal returns. In the short run at least one input is fixed, so additional workers have less capital or workspace to work with and add less extra output.",
            explanation="The classic short-run explanation is that labor is increasing while another input remains fixed.",
            rubric=["diminishing marginal returns", "short run has a fixed input", "additional workers have less capital or space"],
            trap="Do not say total output must fall immediately. Diminishing marginal returns can occur while total output is still increasing.",
        ),
    )

    add(
        "perfect-competition",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-perfect-competition-1",
            topic_id="perfect-competition",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A perfectly competitive firm maximizes profit by producing the quantity where",
            choices=[
                "price equals average total cost",
                "marginal revenue equals marginal cost",
                "total revenue equals total cost",
                "average variable cost equals fixed cost",
            ],
            answer="marginal revenue equals marginal cost",
            explanation="In perfect competition, the firm is a price taker and expands output until marginal revenue equals marginal cost.",
            trap="Price may equal average total cost in long-run equilibrium, but marginal revenue equals marginal cost is still the output rule.",
        ),
    )
    add(
        "perfect-competition",
        lambda unit_id, source_ids: _frq(
            question_id="frq-perfect-competition-1",
            topic_id="perfect-competition",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A perfectly competitive firm faces a market price of $14. At its profit-maximizing quantity, average total cost is $11 and average variable cost is $8.",
            prompt="Determine whether the firm earns profit, breaks even, or incurs a loss, and explain whether it should continue producing in the short run.",
            answer="The firm earns economic profit because price exceeds average total cost. It should continue producing in the short run because price also exceeds average variable cost.",
            explanation="Profit depends on price relative to average total cost, and shutdown depends on price relative to average variable cost.",
            rubric=["profit because price above atc", "continue producing", "because price above avc"],
            trap="Shutdown is based on average variable cost, not average total cost.",
        ),
    )

    add(
        "monopoly",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-monopoly-1",
            topic_id="monopoly",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Which step comes immediately after a monopolist finds the quantity where MR = MC?",
            choices=[
                "Read the price from the marginal revenue curve",
                "Read the price from the demand curve",
                "Set price equal to average total cost",
                "Set price equal to marginal cost",
            ],
            answer="Read the price from the demand curve",
            explanation="MR = MC gives the monopoly quantity. The monopolist then goes up to the demand curve to find the price charged to consumers.",
            trap="Marginal revenue does not equal the monopoly price except by coincidence.",
        ),
    )
    add(
        "monopoly",
        lambda unit_id, source_ids: _frq(
            question_id="frq-monopoly-1",
            topic_id="monopoly",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A monopolist produces where marginal revenue equals marginal cost at 50 units. At that output, the demand curve shows a price of $22 and average total cost is $15.",
            prompt="Calculate the monopolist's profit and explain why the output is not allocatively efficient.",
            answer="Profit is $350 because profit equals (22 - 15) x 50. The output is not allocatively efficient because a monopoly produces where price exceeds marginal cost and restricts quantity below the socially efficient level.",
            explanation="A complete AP answer uses average total cost for profit and explains that allocative efficiency requires price to equal marginal cost.",
            rubric=["profit equals 350", "uses 22 minus 15 times 50", "not allocatively efficient", "price exceeds marginal cost or quantity below efficient level"],
            trap="Do not use marginal cost in the profit formula. Profit uses average total cost.",
        ),
    )
    add(
        "monopoly",
        lambda unit_id, source_ids: _graph(
            question_id="graph-monopoly-efficient-point",
            topic_id="monopoly",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="On the monopoly graph, click the allocatively efficient point.",
            prompt="Click the point representing the socially efficient quantity where price equals marginal cost.",
            explanation="The allocatively efficient point is where the demand curve intersects the marginal cost curve, labeled Qe in this module.",
            trap="Do not click the monopoly outcome. The monopolist's chosen point is not allocatively efficient.",
            module_id="monopoly-costs",
            target_type="point",
            target_id="efficient-point",
            target_label="Qe",
            difficulty="hard",
        ),
    )

    add(
        "monopolistic-competition-oligopoly",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-monopolistic-competition-oligopoly-1",
            topic_id="monopolistic-competition-oligopoly",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Which market structure is characterized by a few interdependent firms and strategic behavior?",
            choices=[
                "Perfect competition",
                "Monopolistic competition",
                "Oligopoly",
                "Pure monopoly",
            ],
            answer="Oligopoly",
            explanation="Oligopoly involves a small number of firms that must account for rivals' likely reactions.",
            trap="Monopolistic competition has many firms; oligopoly has only a few major firms.",
            difficulty="easy",
        ),
    )
    add(
        "monopolistic-competition-oligopoly",
        lambda unit_id, source_ids: _frq(
            question_id="frq-monopolistic-competition-oligopoly-1",
            topic_id="monopolistic-competition-oligopoly",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Two dominant airlines each must choose whether to lower fares. Each firm earns the highest joint profit when both keep fares high, but each can gain market share by cutting fares if the other does not.",
            prompt="Explain why this situation resembles a prisoner's dilemma in oligopoly.",
            answer="This resembles a prisoner's dilemma because each airline has an incentive to cut fares regardless of what the other does, even though both firms would earn higher joint profit if neither cut fares.",
            explanation="The key idea is that individually rational behavior can lead to a collectively worse result.",
            rubric=["each firm has incentive to cut fares", "regardless of the other firm's choice", "both would be better off keeping fares high"],
            trap="Do not describe this as monopoly behavior. The strategic interdependence itself is the clue.",
        ),
    )

    add(
        "factor-markets-labor",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-factor-markets-labor-1",
            topic_id="factor-markets-labor",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="In a competitive labor market, a profit-maximizing firm hires workers up to the point where",
            choices=[
                "wage equals average total cost",
                "marginal revenue product equals the wage rate",
                "marginal factor cost exceeds marginal revenue",
                "labor supply equals labor demand for the whole industry",
            ],
            answer="marginal revenue product equals the wage rate",
            explanation="For a wage-taking firm, the wage is the marginal factor cost, so the hiring rule is marginal revenue product equals the wage.",
            trap="Do not switch to the industry equilibrium condition when the question asks about a single firm.",
        ),
    )
    add(
        "factor-markets-labor",
        lambda unit_id, source_ids: _frq(
            question_id="frq-factor-markets-labor-1",
            topic_id="factor-markets-labor",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A firm pays a wage of $18 per worker. The marginal revenue product of the next worker is $24, and the marginal revenue product of the following worker is $15.",
            prompt="Should the firm hire the next worker, the following worker, both, or neither? Explain.",
            answer="The firm should hire the next worker because the worker adds $24 in revenue while costing $18. The firm should not hire the following worker because that worker adds only $15, which is less than the $18 wage.",
            explanation="The hiring rule is to add workers as long as marginal revenue product is at least as large as marginal factor cost.",
            rubric=["hire worker with mrp 24", "do not hire worker with mrp 15", "compare mrp to wage or mfc"],
            trap="Use the marginal worker decision rule. Do not average the two workers together.",
        ),
    )

    add(
        "factor-markets",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-factor-markets-1",
            topic_id="factor-markets",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A monopsonist hiring labor faces a labor supply curve that is",
            choices=[
                "perfectly elastic to the individual firm",
                "downward sloping",
                "upward sloping",
                "the same as the firm's marginal revenue curve",
            ],
            answer="upward sloping",
            explanation="A monopsonist must raise the wage to attract additional workers, so the labor supply curve to the firm is upward sloping.",
            trap="Monopsony is a buyer-side market power model, not a price-taking hiring model.",
        ),
    )
    add(
        "factor-markets",
        lambda unit_id, source_ids: _frq(
            question_id="frq-factor-markets-1",
            topic_id="factor-markets",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A town has one major hospital that hires most nurses in the area.",
            prompt="Explain why the hospital may pay a wage below nurses' marginal revenue product and identify the market structure involved.",
            answer="The hospital is a monopsonist in the labor market. Because it faces an upward-sloping labor supply curve, its marginal factor cost exceeds the wage, so it hires where marginal revenue product equals marginal factor cost and may pay a wage below workers' marginal revenue product.",
            explanation="Monopsony power lets a labor buyer hire fewer workers at a lower wage than in a competitive labor market.",
            rubric=["monopsony or monopsonist", "upward sloping labor supply", "marginal factor cost above wage", "wage below marginal revenue product"],
            trap="Do not call the hospital a monopoly in the labor market. It is a single major buyer of labor, not a seller of output.",
        ),
    )

    add(
        "externalities",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-externalities-1",
            topic_id="externalities",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="In the presence of a negative production externality, the market output is typically",
            choices=[
                "below the socially optimal level",
                "equal to the socially optimal level",
                "above the socially optimal level",
                "zero because firms stop producing",
            ],
            answer="above the socially optimal level",
            explanation="When producers ignore external costs, private marginal cost is below social marginal cost, so the market overproduces.",
            trap="Negative externalities create overproduction, not underproduction.",
        ),
    )
    add(
        "externalities",
        lambda unit_id, source_ids: _frq(
            question_id="frq-externalities-1",
            topic_id="externalities",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A factory emits pollution that harms nearby residents, but the factory does not pay for that harm.",
            prompt="Explain why the market quantity is inefficient and identify one policy that could move output toward the socially optimal level.",
            answer="The market quantity is too high because firms base output on private cost and ignore the external cost imposed on others. A corrective tax could raise the firm's private cost toward the social cost and reduce output toward the socially optimal level.",
            explanation="A strong AP answer links overproduction to marginal social cost exceeding marginal private cost and names a corrective policy.",
            rubric=["market quantity too high or overproduction", "external cost ignored", "corrective tax or regulation", "moves output toward socially optimal level"],
            trap="Do not describe this as a positive externality. Pollution is a negative externality because third parties are harmed.",
        ),
    )

    add(
        "public-common-goods",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-public-common-goods-1",
            topic_id="public-common-goods",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Which combination best describes a public good?",
            choices=[
                "Rival and excludable",
                "Rival and nonexcludable",
                "Nonrival and nonexcludable",
                "Nonrival and excludable",
            ],
            answer="Nonrival and nonexcludable",
            explanation="Public goods are nonrival in consumption and nonexcludable, which creates the free-rider problem.",
            trap="Common resources are nonexcludable too, but they are rival, not nonrival.",
            difficulty="easy",
        ),
    )
    add(
        "public-common-goods",
        lambda unit_id, source_ids: _frq(
            question_id="frq-public-common-goods-1",
            topic_id="public-common-goods",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A city considers funding a fireworks display through voluntary donations, but many residents decide not to contribute even though they want to watch it.",
            prompt="Explain the free-rider problem and why it causes underprovision of the fireworks display.",
            answer="Because the fireworks display is nonexcludable, residents can enjoy it even if they do not pay. This creates a free-rider problem, so private donations are too low and the market underprovides the public good.",
            explanation="The key AP logic is nonexcludability leading to free-riding and then to underprovision.",
            rubric=["nonexcludable", "people can benefit without paying", "free-rider problem", "underprovision of public good"],
            trap="Do not say the fireworks display is rival in consumption. One person's viewing does not significantly reduce another's.",
        ),
    )

    add(
        "inequality",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-inequality-1",
            topic_id="inequality",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="If the Lorenz curve moves farther away from the line of equality, the Gini coefficient will",
            choices=[
                "fall toward zero",
                "remain unchanged",
                "rise",
                "become negative",
            ],
            answer="rise",
            explanation="A Lorenz curve farther from the line of equality indicates greater income inequality, which corresponds to a larger Gini coefficient.",
            trap="A Gini coefficient near zero means more equality, not more inequality.",
        ),
    )
    add(
        "inequality",
        lambda unit_id, source_ids: _frq(
            question_id="frq-inequality-1",
            topic_id="inequality",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="After a recession, a country's Lorenz curve bows farther away from the line of equality.",
            prompt="Explain what happened to income distribution and the likely direction of change in the Gini coefficient.",
            answer="Income distribution became more unequal. Because the Lorenz curve moved farther from the line of equality, the Gini coefficient likely increased.",
            explanation="The Lorenz curve and Gini coefficient move together as summary measures of inequality.",
            rubric=["income distribution became more unequal", "lorenz curve farther from equality line", "gini coefficient increased"],
            trap="Do not say the economy became more equal. Greater bowing means more inequality.",
        ),
    )

    add(
        "market-failure",
        lambda unit_id, source_ids: _mcq(
            question_id="mcq-market-failure-1",
            topic_id="market-failure",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="Market failure occurs when",
            choices=[
                "markets always maximize social welfare",
                "the market equilibrium does not maximize total surplus for society",
                "producers earn accounting profit",
                "prices change in response to shortages",
            ],
            answer="the market equilibrium does not maximize total surplus for society",
            explanation="Market failure means the unregulated market outcome is not socially efficient.",
            trap="A changing price is not a market failure by itself. It is often how markets self-correct.",
        ),
    )
    add(
        "market-failure",
        lambda unit_id, source_ids: _frq(
            question_id="frq-market-failure-1",
            topic_id="market-failure",
            unit_id=unit_id,
            source_ids=source_ids,
            stem="A city government is deciding whether to regulate pollution, fund a public transit system, and limit overfishing in a nearby lake.",
            prompt="Explain how these actions relate to market failure and why government intervention may increase efficiency.",
            answer="These issues involve market failure because private markets may ignore external costs, underprovide public goods, or overuse common resources. Government intervention may increase efficiency by correcting incentives, expanding socially beneficial output, or protecting scarce common resources.",
            explanation="A strong synthesis answer names externalities, public goods, or common resources and links each to inefficiency in the unregulated market.",
            rubric=["mentions externalities or pollution", "mentions public goods or public transit", "mentions common resources or overfishing", "government intervention may improve efficiency"],
            trap="Do not treat all three problems as the same mechanism. The AP framework separates externalities, public goods, and common resources.",
        ),
    )

    return question_bank
