from fastapi import APIRouter, HTTPException, Query

from app.schemas.kb import (
    DiscoverToolsResponse,
    KnowledgeBaseCreate,
    KnowledgeBaseListResponse,
    KnowledgeBaseResponse,
    KnowledgeBaseUpdate,
    KbStatus,
    TestConnectionResponse,
    TrialSearchRequest,
    TrialSearchResponse,
)
from app.services import kb_service

router = APIRouter(prefix="/kb", tags=["knowledge-bases"])


@router.get("", response_model=KnowledgeBaseListResponse)
def list_knowledge_bases(
    search: str | None = Query(default=None),
    status: KbStatus | None = Query(default=None),
) -> KnowledgeBaseListResponse:
    items, total = kb_service.list_knowledge_bases(search=search, status=status)
    return KnowledgeBaseListResponse(items=items, total=total)


@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
def get_knowledge_base(kb_id: str) -> KnowledgeBaseResponse:
    item = kb_service.get_knowledge_base(kb_id)
    if not item:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return item


@router.post("", response_model=KnowledgeBaseResponse, status_code=201)
def create_knowledge_base(data: KnowledgeBaseCreate) -> KnowledgeBaseResponse:
    try:
        return kb_service.create_knowledge_base(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put("/{kb_id}", response_model=KnowledgeBaseResponse)
def update_knowledge_base(kb_id: str, data: KnowledgeBaseUpdate) -> KnowledgeBaseResponse:
    try:
        item = kb_service.update_knowledge_base(kb_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not item:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return item


@router.delete("/{kb_id}", status_code=204)
def delete_knowledge_base(kb_id: str) -> None:
    if not kb_service.delete_knowledge_base(kb_id):
        raise HTTPException(status_code=404, detail="知识库不存在")


@router.post("/{kb_id}/test-connection", response_model=TestConnectionResponse)
def test_connection(kb_id: str) -> TestConnectionResponse:
    result = kb_service.test_connection(kb_id)
    if not result:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return result


@router.post("/{kb_id}/discover-tools", response_model=DiscoverToolsResponse)
def discover_tools(kb_id: str) -> DiscoverToolsResponse:
    try:
        result = kb_service.discover_tools(kb_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return result


@router.post("/{kb_id}/trial-search", response_model=TrialSearchResponse)
def trial_search(kb_id: str, data: TrialSearchRequest) -> TrialSearchResponse:
    try:
        result = kb_service.trial_search(kb_id, query=data.query, top_k=data.top_k)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return result
