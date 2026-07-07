from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

EvaluationMode = Literal["retrieval_only", "rag_full"]
EvaluationStatus = Literal["pending", "running", "completed", "failed", "cancelled"]
ScoringMethod = Literal["semantic_similarity", "llm_judge"]
FailureType = Literal[
    "mcp_error",
    "no_recall",
    "wrong_answer",
    "hallucination",
    "incomplete",
    "mapping_error",
]


class EvaluationConfig(BaseModel):
    top_k: int = Field(default=5, ge=1, le=50)
    pass_threshold: float = Field(default=70, ge=0, le=100)
    scoring_method: ScoringMethod = "semantic_similarity"
    mcp_timeout_ms: int = Field(default=30000, ge=1000, le=120000)


class EvaluationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    kb_id: str
    question_bank_id: str
    mode: EvaluationMode = "retrieval_only"
    config: EvaluationConfig = Field(default_factory=EvaluationConfig)


class EvaluationResponse(BaseModel):
    id: str
    name: str
    kb_id: str
    kb_name: str
    question_bank_id: str
    question_bank_name: str
    mode: EvaluationMode
    config: EvaluationConfig
    status: EvaluationStatus
    progress: int
    completed_questions: int
    total_questions: int
    overall_score: float | None = None
    pass_rate: float | None = None
    error_message: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None


class EvaluationListResponse(BaseModel):
    items: list[EvaluationResponse]
    total: int


class ChunkResult(BaseModel):
    content: str
    source: str
    title: str | None = None
    score: float | None = None


class EvaluationResultResponse(BaseModel):
    id: str
    question_id: str
    question: str
    expected_answer: str
    category: str | None = None
    difficulty: str | None = None
    mcp_tool: str
    mcp_request: dict
    mcp_response_raw: dict | None = None
    chunks: list[ChunkResult]
    generated_answer: str | None = None
    score: float
    passed: bool
    failure_type: FailureType | None = None
    failure_reason: str | None = None
    latency_ms: int
    created_at: datetime


class EvaluationResultsListResponse(BaseModel):
    items: list[EvaluationResultResponse]
    total: int
    page: int
    page_size: int


class CategoryScore(BaseModel):
    category: str
    score: float
    pass_rate: float
    total: int


class ReportSummary(BaseModel):
    overall_score: float
    pass_rate: float
    recall_rate: float
    mcp_success_rate: float
    avg_mcp_latency_ms: float
    total_questions: int
    passed: int
    failed: int


class EvaluationReportResponse(BaseModel):
    task_id: str
    task_name: str
    kb_name: str
    question_bank_name: str
    mode: EvaluationMode
    status: EvaluationStatus
    completed_at: datetime | None
    summary: ReportSummary
    failure_distribution: dict[str, int]
    category_scores: list[CategoryScore]
