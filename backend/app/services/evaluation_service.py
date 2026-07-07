from __future__ import annotations

import logging
import threading
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.mcp.exceptions import McpClientError
from app.schemas.evaluation import (
    CategoryScore,
    ChunkResult,
    EvaluationConfig,
    EvaluationCreate,
    EvaluationReportResponse,
    EvaluationResponse,
    EvaluationResultResponse,
    EvaluationResultsListResponse,
    ReportSummary,
)
from app.schemas.kb import ChunkResponse
from app.services import kb_service, question_bank_service
from app.services.scoring import score_retrieval, score_with_llm_judge_heuristic

logger = logging.getLogger(__name__)


@dataclass
class EvaluationResultRecord:
    id: str
    question_id: str
    question: str
    expected_answer: str
    category: str | None
    difficulty: str | None
    source_ref: str | None
    mcp_tool: str
    mcp_request: dict
    mcp_response_raw: dict | None
    chunks: list[ChunkResponse]
    generated_answer: str | None
    score: float
    passed: bool
    failure_type: str | None
    failure_reason: str | None
    latency_ms: int
    created_at: datetime


@dataclass
class EvaluationTaskRecord:
    id: str
    name: str
    kb_id: str
    kb_name: str
    question_bank_id: str
    question_bank_name: str
    mode: str
    config: EvaluationConfig
    status: str
    progress: int
    completed_questions: int
    total_questions: int
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    cancelled: bool = False
    results: list[EvaluationResultRecord] = field(default_factory=list)


@dataclass
class EvaluationStore:
    tasks: dict[str, EvaluationTaskRecord] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def __post_init__(self) -> None:
        if not self.tasks:
            self._seed_demo_data()

    def _seed_demo_data(self) -> None:
        now = datetime.now(timezone.utc)
        config = EvaluationConfig(top_k=5, pass_threshold=70, scoring_method="semantic_similarity")
        task = EvaluationTaskRecord(
            id="eval-demo-001",
            name="售后政策回归测评",
            kb_id="kb-demo-001",
            kb_name="售后知识库",
            question_bank_id="qb-demo-001",
            question_bank_name="售后政策演示题库",
            mode="retrieval_only",
            config=config,
            status="completed",
            progress=100,
            completed_questions=20,
            total_questions=20,
            error_message=None,
            created_at=now,
            started_at=now,
            completed_at=now,
        )
        demo_results = _build_demo_results(task.id, now)
        task.results = demo_results
        self.tasks[task.id] = task


def _build_demo_results(task_id: str, base_time: datetime) -> list[EvaluationResultRecord]:
    bank = question_bank_service.get_question_bank("qb-demo-001")
    if not bank:
        return []

    results: list[EvaluationResultRecord] = []
    for idx, question in enumerate(bank.questions[:20]):
        passed = idx % 5 != 4
        score = 88.5 if passed else 42.0
        chunks = [
            ChunkResponse(
                content=question.expected_answer,
                source=question.source_ref or "doc://after-sales-policy/v2.3#section-3",
                title="售后政策",
                score=0.9 if passed else 0.4,
            )
        ]
        results.append(
            EvaluationResultRecord(
                id=f"er-{uuid.uuid4().hex[:10]}",
                question_id=question.id,
                question=question.question,
                expected_answer=question.expected_answer,
                category=question.category,
                difficulty=question.difficulty,
                source_ref=question.source_ref,
                mcp_tool="kb_search",
                mcp_request={"query": question.question, "top_k": 5},
                mcp_response_raw={"results": [c.model_dump() for c in chunks]},
                chunks=chunks,
                generated_answer=None,
                score=score,
                passed=passed,
                failure_type=None if passed else "wrong_answer",
                failure_reason=None if passed else "召回片段与期望答案不匹配",
                latency_ms=320 + idx * 15,
                created_at=base_time,
            )
        )
    return results


store = EvaluationStore()


def _chunks_to_result(chunks: list[ChunkResponse]) -> list[ChunkResult]:
    return [
        ChunkResult(
            content=c.content,
            source=c.source,
            title=c.title,
            score=c.score,
        )
        for c in chunks
    ]


def _compute_summary(task: EvaluationTaskRecord) -> tuple[float | None, float | None]:
    if not task.results:
        return None, None
    total = len(task.results)
    passed = sum(1 for r in task.results if r.passed)
    overall = round(sum(r.score for r in task.results) / total, 1)
    pass_rate = round(passed / total, 4)
    return overall, pass_rate


def _to_response(task: EvaluationTaskRecord) -> EvaluationResponse:
    overall, pass_rate = _compute_summary(task)
    return EvaluationResponse(
        id=task.id,
        name=task.name,
        kb_id=task.kb_id,
        kb_name=task.kb_name,
        question_bank_id=task.question_bank_id,
        question_bank_name=task.question_bank_name,
        mode=task.mode,  # type: ignore[arg-type]
        config=task.config,
        status=task.status,  # type: ignore[arg-type]
        progress=task.progress,
        completed_questions=task.completed_questions,
        total_questions=task.total_questions,
        overall_score=overall,
        pass_rate=pass_rate,
        error_message=task.error_message,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
    )


def _to_result_response(record: EvaluationResultRecord) -> EvaluationResultResponse:
    return EvaluationResultResponse(
        id=record.id,
        question_id=record.question_id,
        question=record.question,
        expected_answer=record.expected_answer,
        category=record.category,
        difficulty=record.difficulty,  # type: ignore[arg-type]
        mcp_tool=record.mcp_tool,
        mcp_request=record.mcp_request,
        mcp_response_raw=record.mcp_response_raw,
        chunks=_chunks_to_result(record.chunks),
        generated_answer=record.generated_answer,
        score=record.score,
        passed=record.passed,
        failure_type=record.failure_type,  # type: ignore[arg-type]
        failure_reason=record.failure_reason,
        latency_ms=record.latency_ms,
        created_at=record.created_at,
    )


def list_evaluations(
    status: str | None = None,
    search: str | None = None,
) -> tuple[list[EvaluationResponse], int]:
    items = [_to_response(t) for t in store.tasks.values()]
    if status:
        items = [item for item in items if item.status == status]
    if search:
        keyword = search.lower()
        items = [
            item
            for item in items
            if keyword in item.name.lower()
            or keyword in item.kb_name.lower()
            or keyword in item.question_bank_name.lower()
        ]
    items.sort(key=lambda x: x.created_at, reverse=True)
    return items, len(items)


def get_evaluation(task_id: str) -> EvaluationResponse | None:
    task = store.tasks.get(task_id)
    if not task:
        return None
    return _to_response(task)


def get_results(
    task_id: str,
    page: int = 1,
    page_size: int = 20,
) -> EvaluationResultsListResponse | None:
    task = store.tasks.get(task_id)
    if not task:
        return None
    page = max(1, page)
    page_size = min(max(1, page_size), 100)
    start = (page - 1) * page_size
    end = start + page_size
    sliced = task.results[start:end]
    return EvaluationResultsListResponse(
        items=[_to_result_response(r) for r in sliced],
        total=len(task.results),
        page=page,
        page_size=page_size,
    )


def get_report(task_id: str) -> EvaluationReportResponse | None:
    task = store.tasks.get(task_id)
    if not task or not task.results:
        return None

    total = len(task.results)
    passed = sum(1 for r in task.results if r.passed)
    non_mcp_error = sum(1 for r in task.results if r.failure_type != "mcp_error")
    non_no_recall = sum(1 for r in task.results if r.failure_type != "no_recall")
    latencies = [r.latency_ms for r in task.results]

    failure_distribution: dict[str, int] = {}
    for result in task.results:
        if result.failure_type:
            failure_distribution[result.failure_type] = (
                failure_distribution.get(result.failure_type, 0) + 1
            )

    category_map: dict[str, list[EvaluationResultRecord]] = {}
    for result in task.results:
        key = result.category or "未分类"
        category_map.setdefault(key, []).append(result)

    category_scores = [
        CategoryScore(
            category=category,
            score=round(sum(r.score for r in records) / len(records), 1),
            pass_rate=round(sum(1 for r in records if r.passed) / len(records), 4),
            total=len(records),
        )
        for category, records in sorted(category_map.items())
    ]

    return EvaluationReportResponse(
        task_id=task.id,
        task_name=task.name,
        kb_name=task.kb_name,
        question_bank_name=task.question_bank_name,
        mode=task.mode,  # type: ignore[arg-type]
        status=task.status,  # type: ignore[arg-type]
        completed_at=task.completed_at,
        summary=ReportSummary(
            overall_score=round(sum(r.score for r in task.results) / total, 1),
            pass_rate=round(passed / total, 4),
            recall_rate=round(non_no_recall / total, 4),
            mcp_success_rate=round(non_mcp_error / total, 4),
            avg_mcp_latency_ms=round(sum(latencies) / len(latencies)),
            total_questions=total,
            passed=passed,
            failed=total - passed,
        ),
        failure_distribution=failure_distribution,
        category_scores=category_scores,
    )


def create_evaluation(data: EvaluationCreate) -> EvaluationResponse:
    kb = kb_service.get_knowledge_base(data.kb_id)
    if not kb:
        raise ValueError("MCP 知识库不存在")
    if kb.status != "connected":
        raise ValueError("请先确保 MCP 知识库连接正常")
    if not kb.retrieval_tool:
        raise ValueError("MCP 知识库未配置检索 Tool")

    bank = question_bank_service.get_question_bank(data.question_bank_id)
    if not bank:
        raise ValueError("测评题库不存在")
    if not bank.questions:
        raise ValueError("测评题库为空")

    if data.mode == "rag_full":
        raise ValueError("RAG 全链路测评尚未开放，请使用 retrieval_only")

    now = datetime.now(timezone.utc)
    task = EvaluationTaskRecord(
        id=f"eval-{uuid.uuid4().hex[:12]}",
        name=data.name.strip(),
        kb_id=data.kb_id,
        kb_name=kb.name,
        question_bank_id=data.question_bank_id,
        question_bank_name=bank.name,
        mode=data.mode,
        config=data.config,
        status="pending",
        progress=0,
        completed_questions=0,
        total_questions=len(bank.questions),
        error_message=None,
        created_at=now,
        started_at=None,
        completed_at=None,
    )

    with store._lock:
        store.tasks[task.id] = task

    thread = threading.Thread(target=_run_evaluation, args=(task.id,), daemon=True)
    thread.start()

    return _to_response(task)


def cancel_evaluation(task_id: str) -> EvaluationResponse | None:
    task = store.tasks.get(task_id)
    if not task:
        return None
    if task.status not in ("pending", "running"):
        raise ValueError("仅进行中的任务可取消")

    task.cancelled = True
    if task.status == "pending":
        task.status = "cancelled"
        task.completed_at = datetime.now(timezone.utc)

    return _to_response(task)


def _run_evaluation(task_id: str) -> None:
    task = store.tasks.get(task_id)
    if not task:
        return

    bank = question_bank_service.get_question_bank(task.question_bank_id)
    kb_record = kb_service.store.records.get(task.kb_id)
    if not bank or not kb_record:
        task.status = "failed"
        task.error_message = "关联的知识库或题库不存在"
        task.completed_at = datetime.now(timezone.utc)
        return

    task.status = "running"
    task.started_at = datetime.now(timezone.utc)
    consecutive_mcp_errors = 0

    for idx, question in enumerate(bank.questions):
        if task.cancelled:
            task.status = "cancelled"
            task.completed_at = datetime.now(timezone.utc)
            return

        mcp_request = {"query": question.question, "top_k": task.config.top_k}
        start = time.perf_counter()
        chunks: list[ChunkResponse] = []
        mcp_response_raw: dict | None = None
        failure_type: str | None = None
        failure_reason: str | None = None
        score = 0.0
        passed = False

        try:
            search_result = kb_service.trial_search(
                task.kb_id,
                question.question,
                top_k=task.config.top_k,
            )
            latency_ms = int((time.perf_counter() - start) * 1000)
            if search_result:
                chunks = search_result.chunks
                mcp_response_raw = {"results": [c.model_dump() for c in chunks]}
                consecutive_mcp_errors = 0

                if task.config.scoring_method == "llm_judge":
                    scored = score_with_llm_judge_heuristic(
                        question=question.question,
                        expected_answer=question.expected_answer,
                        chunks=chunks,
                        source_ref=question.source_ref,
                        pass_threshold=task.config.pass_threshold,
                    )
                else:
                    scored = score_retrieval(
                        expected_answer=question.expected_answer,
                        chunks=chunks,
                        source_ref=question.source_ref,
                        pass_threshold=task.config.pass_threshold,
                    )
                score = scored.score
                passed = scored.passed
                failure_type = scored.failure_type
                failure_reason = scored.failure_reason
            else:
                latency_ms = int((time.perf_counter() - start) * 1000)
                failure_type = "mcp_error"
                failure_reason = "MCP 检索返回空"
        except McpClientError as exc:
            latency_ms = int((time.perf_counter() - start) * 1000)
            failure_type = "mcp_error"
            failure_reason = exc.message
            consecutive_mcp_errors += 1
        except ValueError as exc:
            latency_ms = int((time.perf_counter() - start) * 1000)
            failure_type = "mcp_error"
            failure_reason = str(exc)
            consecutive_mcp_errors += 1
        except Exception as exc:
            logger.exception("Evaluation question failed: %s", task_id)
            latency_ms = int((time.perf_counter() - start) * 1000)
            failure_type = "mcp_error"
            failure_reason = str(exc) or "未知错误"
            consecutive_mcp_errors += 1

        if consecutive_mcp_errors >= 5:
            task.status = "failed"
            task.error_message = "连续 MCP 调用失败，任务已中止"
            task.completed_at = datetime.now(timezone.utc)
            return

        result = EvaluationResultRecord(
            id=f"er-{uuid.uuid4().hex[:10]}",
            question_id=question.id,
            question=question.question,
            expected_answer=question.expected_answer,
            category=question.category,
            difficulty=question.difficulty,
            source_ref=question.source_ref,
            mcp_tool=kb_record.retrieval_tool or "kb_search",
            mcp_request=mcp_request,
            mcp_response_raw=mcp_response_raw,
            chunks=chunks,
            generated_answer=chunks[0].content[:200] if chunks else None,
            score=score,
            passed=passed,
            failure_type=failure_type,
            failure_reason=failure_reason,
            latency_ms=latency_ms,
            created_at=datetime.now(timezone.utc),
        )
        task.results.append(result)
        task.completed_questions = idx + 1
        task.progress = int(task.completed_questions / task.total_questions * 100)

        time.sleep(0.05)

    task.status = "completed"
    task.progress = 100
    task.completed_at = datetime.now(timezone.utc)
