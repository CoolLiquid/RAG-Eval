from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.schemas.question_bank import (
    ImportQuestionBankResponse,
    QuestionBankDetailResponse,
    QuestionBankListResponse,
    QuestionBankType,
)
from app.services import question_bank_service

router = APIRouter(prefix="/question-banks", tags=["question-banks"])


@router.get("", response_model=QuestionBankListResponse)
def list_question_banks(
    type: QuestionBankType | None = Query(default=None, alias="type"),
    search: str | None = Query(default=None),
) -> QuestionBankListResponse:
    items, total = question_bank_service.list_question_banks(bank_type=type, search=search)
    return QuestionBankListResponse(items=items, total=total)


@router.get("/template")
def download_csv_template() -> StreamingResponse:
    content = question_bank_service.get_csv_template()
    return StreamingResponse(
        iter([content.encode("utf-8-sig")]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="question_bank_template.csv"'},
    )


@router.get("/{bank_id}", response_model=QuestionBankDetailResponse)
def get_question_bank(bank_id: str) -> QuestionBankDetailResponse:
    item = question_bank_service.get_question_bank(bank_id)
    if not item:
        raise HTTPException(status_code=404, detail="题库不存在")
    return item


@router.post("/import", response_model=ImportQuestionBankResponse, status_code=201)
async def import_question_bank(
    file: UploadFile = File(...),
    name: str | None = Form(default=None),
) -> ImportQuestionBankResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=422, detail="请上传 CSV 文件")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=422, detail="CSV 文件为空")

    try:
        return question_bank_service.import_question_bank_csv(content, name=name)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/{bank_id}", status_code=204)
def delete_question_bank(bank_id: str) -> None:
    deleted, reason = question_bank_service.delete_question_bank(bank_id)
    if not deleted and reason is None:
        raise HTTPException(status_code=404, detail="题库不存在")
    if not deleted and reason:
        raise HTTPException(status_code=403, detail=reason)
