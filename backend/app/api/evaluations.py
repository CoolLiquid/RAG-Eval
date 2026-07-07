from fastapi import APIRouter, HTTPException, Query

from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationListResponse,
    EvaluationReportResponse,
    EvaluationResponse,
    EvaluationResultsListResponse,
    EvaluationStatus,
)
from app.services import evaluation_service

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.get("", response_model=EvaluationListResponse)
def list_evaluations(
    status: EvaluationStatus | None = Query(default=None),
    search: str | None = Query(default=None),
) -> EvaluationListResponse:
    items, total = evaluation_service.list_evaluations(status=status, search=search)
    return EvaluationListResponse(items=items, total=total)


@router.post("", response_model=EvaluationResponse, status_code=201)
def create_evaluation(data: EvaluationCreate) -> EvaluationResponse:
    try:
        return evaluation_service.create_evaluation(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{task_id}", response_model=EvaluationResponse)
def get_evaluation(task_id: str) -> EvaluationResponse:
    item = evaluation_service.get_evaluation(task_id)
    if not item:
        raise HTTPException(status_code=404, detail="测评任务不存在")
    return item


@router.post("/{task_id}/cancel", response_model=EvaluationResponse)
def cancel_evaluation(task_id: str) -> EvaluationResponse:
    try:
        item = evaluation_service.cancel_evaluation(task_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not item:
        raise HTTPException(status_code=404, detail="测评任务不存在")
    return item


@router.get("/{task_id}/results", response_model=EvaluationResultsListResponse)
def get_evaluation_results(
    task_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> EvaluationResultsListResponse:
    item = evaluation_service.get_results(task_id, page=page, page_size=page_size)
    if not item:
        raise HTTPException(status_code=404, detail="测评任务不存在")
    return item


@router.get("/{task_id}/report", response_model=EvaluationReportResponse)
def get_evaluation_report(task_id: str) -> EvaluationReportResponse:
    task = evaluation_service.get_evaluation(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="测评任务不存在")
    if task.status not in ("completed", "failed", "cancelled"):
        raise HTTPException(status_code=409, detail="测评尚未完成，无法查看报告")
    report = evaluation_service.get_report(task_id)
    if not report:
        raise HTTPException(status_code=404, detail="暂无报告数据")
    return report
