from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

QuestionDifficulty = Literal["easy", "medium", "hard"]
QuestionBankType = Literal["builtin", "custom"]


class QuestionResponse(BaseModel):
    id: str
    question: str
    expected_answer: str
    category: str | None = None
    difficulty: QuestionDifficulty | None = None
    source_ref: str | None = None


class QuestionBankResponse(BaseModel):
    id: str
    name: str
    type: QuestionBankType
    question_count: int
    categories: list[str]
    created_at: datetime


class QuestionBankDetailResponse(QuestionBankResponse):
    questions: list[QuestionResponse]


class QuestionBankListResponse(BaseModel):
    items: list[QuestionBankResponse]
    total: int


class SkippedRow(BaseModel):
    row: int
    reason: str


class ImportQuestionBankResponse(BaseModel):
    bank: QuestionBankResponse
    imported_count: int
    skipped_rows: list[SkippedRow] = Field(default_factory=list)
