from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.models.schemas import GraphAnalyzerRequest, GraphAnalyzerResponse
from app.services.graph_analyzer import infer_graph

router = APIRouter(prefix="/api/graph-analyzer", tags=["graph-analyzer"])


@router.post("/reconstruct", response_model=GraphAnalyzerResponse)
def reconstruct_graph(request: GraphAnalyzerRequest) -> GraphAnalyzerResponse:
    return infer_graph(request)


@router.post("/upload", response_model=GraphAnalyzerResponse)
async def reconstruct_from_upload(file: UploadFile = File(...)) -> GraphAnalyzerResponse:
    return infer_graph(GraphAnalyzerRequest(upload_id=file.filename, expected_graph_type=Path(file.filename).stem))
