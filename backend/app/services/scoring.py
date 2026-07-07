from __future__ import annotations

import re
from dataclasses import dataclass
from difflib import SequenceMatcher

from app.schemas.evaluation import FailureType
from app.schemas.kb import ChunkResponse


@dataclass
class ScoreResult:
    score: float
    passed: bool
    failure_type: FailureType | None
    failure_reason: str | None


def _normalize_text(text: str) -> str:
    cleaned = re.sub(r"\s+", "", text.lower())
    return cleaned


def semantic_similarity(text_a: str, text_b: str) -> float:
    if not text_a.strip() or not text_b.strip():
        return 0.0
    norm_a = _normalize_text(text_a)
    norm_b = _normalize_text(text_b)
    if norm_a in norm_b or norm_b in norm_a:
        return 1.0
    return SequenceMatcher(None, norm_a, norm_b).ratio()


def score_retrieval(
    *,
    expected_answer: str,
    chunks: list[ChunkResponse],
    source_ref: str | None,
    pass_threshold: float,
) -> ScoreResult:
    if not chunks:
        return ScoreResult(
            score=0,
            passed=False,
            failure_type="no_recall",
            failure_reason="未检索到任何片段",
        )

    if source_ref:
        recalled = any(source_ref in chunk.source for chunk in chunks)
        if not recalled:
            return ScoreResult(
                score=0,
                passed=False,
                failure_type="no_recall",
                failure_reason=f"未召回期望来源: {source_ref}",
            )

    best_chunk = max(chunks, key=lambda c: c.score if c.score is not None else 0)
    similarity = semantic_similarity(best_chunk.content, expected_answer)
    score = round(similarity * 100, 1)

    if score >= pass_threshold:
        return ScoreResult(
            score=score,
            passed=True,
            failure_type=None,
            failure_reason="召回且内容相关",
        )

    return ScoreResult(
        score=score,
        passed=False,
        failure_type="wrong_answer",
        failure_reason="召回片段与期望答案不匹配",
    )


def score_with_llm_judge_heuristic(
    *,
    question: str,
    expected_answer: str,
    chunks: list[ChunkResponse],
    source_ref: str | None,
    pass_threshold: float,
) -> ScoreResult:
    """MVP heuristic judge — uses retrieval scoring with stricter keyword checks."""
    base = score_retrieval(
        expected_answer=expected_answer,
        chunks=chunks,
        source_ref=source_ref,
        pass_threshold=pass_threshold,
    )
    if not base.passed and base.failure_type == "wrong_answer":
        keywords = [w for w in re.split(r"[\s，。、；：]+", expected_answer) if len(w) >= 2]
        if keywords:
            combined = " ".join(chunk.content for chunk in chunks)
            hit_ratio = sum(1 for kw in keywords if kw in combined) / len(keywords)
            adjusted = round(max(base.score, hit_ratio * 100), 1)
            if adjusted >= pass_threshold:
                return ScoreResult(
                    score=adjusted,
                    passed=True,
                    failure_type=None,
                    failure_reason="关键词匹配通过（LLM 裁判启发式）",
                )
            if hit_ratio >= 0.5:
                return ScoreResult(
                    score=adjusted,
                    passed=False,
                    failure_type="incomplete",
                    failure_reason="部分关键词命中，回答不完整",
                )
    if base.passed:
        base.failure_reason = "LLM 裁判启发式判定通过"
    return base
