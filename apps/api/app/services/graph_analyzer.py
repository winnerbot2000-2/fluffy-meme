from __future__ import annotations

from app.models.schemas import GraphAnalyzerRequest, GraphAnalyzerResponse


def _infer_type_from_hint(hint: str | None) -> str:
    if not hint:
        return "supply-demand"
    lowered = hint.lower()
    if "tax" in lowered:
        return "tax"
    if "subsid" in lowered:
        return "subsidy"
    if "ppc" in lowered or "production possibilities" in lowered:
        return "ppc"
    if "monopoly" in lowered or "mr" in lowered or "mc" in lowered:
        return "monopoly"
    return "supply-demand"


def infer_graph(request: GraphAnalyzerRequest) -> GraphAnalyzerResponse:
    graph_type = _infer_type_from_hint(request.expected_graph_type or request.image_url or request.upload_id)
    return GraphAnalyzerResponse(
        graph_type=graph_type,
        confidence=0.52 if request.expected_graph_type else 0.34,
        detected_axes=["Quantity", "Price"] if graph_type != "ppc" else ["Good X", "Good Y"],
        reconstructed_graph_id=f"rebuild-{graph_type}",
        explanation="The upload hook can now accept a screenshot and produce a likely AP Micro graph family plus a starter reconstruction target.",
    )
