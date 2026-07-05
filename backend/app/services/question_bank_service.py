from __future__ import annotations

import csv
import io
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.schemas.question_bank import (
    ImportQuestionBankResponse,
    QuestionBankDetailResponse,
    QuestionBankResponse,
    QuestionBankType,
    QuestionDifficulty,
    QuestionResponse,
    SkippedRow,
)

VALID_DIFFICULTIES = frozenset({"easy", "medium", "hard"})
REQUIRED_COLUMNS = ("question", "expected_answer")
OPTIONAL_COLUMNS = ("category", "difficulty", "source_ref")
CSV_TEMPLATE = (
    "question,expected_answer,category,difficulty,source_ref\n"
    "退货政策是什么,7天内可无理由退货,售后政策,easy,售后手册第3章\n"
)


@dataclass
class QuestionRecord:
    id: str
    question: str
    expected_answer: str
    category: str | None = None
    difficulty: QuestionDifficulty | None = None
    source_ref: str | None = None


@dataclass
class QuestionBankRecord:
    id: str
    name: str
    type: QuestionBankType
    questions: list[QuestionRecord]
    created_at: datetime


@dataclass
class QuestionBankStore:
    banks: dict[str, QuestionBankRecord] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.banks:
            self._seed_demo_data()

    def _seed_demo_data(self) -> None:
        now = datetime.now(timezone.utc)
        demos = [
            QuestionBankRecord(
                id="qb-demo-001",
                name="售后政策演示题库",
                type="builtin",
                questions=_build_after_sales_questions(),
                created_at=now,
            ),
            QuestionBankRecord(
                id="qb-demo-002",
                name="产品 FAQ 演示题库",
                type="builtin",
                questions=_build_product_faq_questions(),
                created_at=now,
            ),
        ]
        for record in demos:
            self.banks[record.id] = record


def _q(
    question: str,
    expected_answer: str,
    *,
    category: str | None = None,
    difficulty: QuestionDifficulty | None = None,
    source_ref: str | None = None,
) -> QuestionRecord:
    return QuestionRecord(
        id=f"q-{uuid.uuid4().hex[:10]}",
        question=question,
        expected_answer=expected_answer,
        category=category,
        difficulty=difficulty,
        source_ref=source_ref,
    )


def _build_after_sales_questions() -> list[QuestionRecord]:
    return [
        # 通用检索 10 题
        _q("退货政策是什么", "7天内可无理由退货", category="售后政策", difficulty="easy"),
        _q("退款多久到账", "3-5个工作日原路退回", category="退换货", difficulty="easy"),
        _q("哪些商品不能退货", "定制类、鲜活易腐类不支持无理由退货", category="售后政策", difficulty="medium"),
        _q("换货流程是怎样的", "提交换货申请后寄回商品，仓库验收通过后发出新商品", category="退换货", difficulty="medium"),
        _q("保修期多长", "电子产品保修12个月", category="保修", difficulty="easy"),
        _q("如何申请维修", "在订单详情页点击申请维修，填写故障描述并上传照片", category="保修", difficulty="medium"),
        _q("运费谁承担", "质量问题由商家承担，非质量问题由买家承担", category="售后政策", difficulty="medium"),
        _q("发票如何开具", "下单时可选择电子发票，订单完成后自动发送至邮箱", category="售后政策", difficulty="easy"),
        _q("投诉渠道有哪些", "可通过在线客服、400电话或邮件提交投诉", category="售后政策", difficulty="easy"),
        _q("海外订单如何退货", "海外订单需联系客服获取退货地址和流程说明", category="退换货", difficulty="hard"),
        # 精确匹配 5 题（含 source_ref）
        _q(
            "自签收后几天内可以无理由退货",
            "7天内可无理由申请退货，商品需保持原包装完好",
            category="售后政策",
            difficulty="easy",
            source_ref="doc://after-sales-policy/v2.3#section-3",
        ),
        _q(
            "退款到账时间",
            "退款将在仓库验收通过后3-5个工作日内原路退回",
            category="退换货",
            difficulty="easy",
            source_ref="doc://after-sales-policy/v2.3#section-4",
        ),
        _q(
            "不支持无理由退货的商品类型",
            "特殊商品（定制类、鲜活易腐类）不支持无理由退货",
            category="售后政策",
            difficulty="medium",
            source_ref="doc://after-sales-policy/v2.3#section-5",
        ),
        _q(
            "保修范围包括什么",
            "非人为损坏的功能性故障均在保修范围内",
            category="保修",
            difficulty="medium",
            source_ref="doc://after-sales-policy/v2.3#section-6",
        ),
        _q(
            "换货时效",
            "换货商品发出后预计3-7个工作日送达",
            category="退换货",
            difficulty="easy",
            source_ref="doc://after-sales-policy/v2.3#section-7",
        ),
        # 边界情况 5 题
        _q("xyzabc123不存在的问题", "无相关答案", category="边界测试", difficulty="hard"),
        _q("退货 换货 维修 区别", "退货退款、换货换新、维修修复，三者适用场景不同", category="边界测试", difficulty="hard"),
        _q("无结果", "", category="边界测试", difficulty="medium"),
        _q("empty", "", category="边界测试", difficulty="medium"),
        _q("同时涉及退货和保修怎么处理", "先判定是否质量问题，质量问题可走保修，非质量问题走退货流程", category="边界测试", difficulty="hard"),
    ]


def _build_product_faq_questions() -> list[QuestionRecord]:
    return [
        _q("产品尺寸是多少", "长200mm × 宽100mm × 高50mm", category="产品规格", difficulty="easy"),
        _q("支持哪些操作系统", "Windows 10/11、macOS 12+、Ubuntu 20.04+", category="产品规格", difficulty="easy"),
        _q("电池续航多久", "正常使用约8小时，待机约72小时", category="产品规格", difficulty="easy"),
        _q("如何连接蓝牙", "长按电源键3秒进入配对模式，在手机蓝牙设置中搜索设备", category="使用指南", difficulty="easy"),
        _q("是否支持快充", "支持18W PD快充，约1.5小时充满", category="产品规格", difficulty="medium"),
        _q("防水等级", "IPX4，可防溅水但不可浸泡", category="产品规格", difficulty="medium"),
        _q("配件包含什么", "主机、USB-C充电线、说明书、保修卡", category="产品规格", difficulty="easy"),
        _q("如何恢复出厂设置", "同时按住音量+和电源键10秒", category="使用指南", difficulty="medium"),
        _q("固件如何升级", "通过官方App检查更新，或访问官网下载固件", category="使用指南", difficulty="medium"),
        _q("最大连接距离", "蓝牙5.0，空旷环境约10米", category="产品规格", difficulty="easy"),
        _q("是否支持多设备切换", "支持同时配对2台设备，可快速切换", category="使用指南", difficulty="medium"),
        _q("存储容量", "内置32GB，不支持扩展", category="产品规格", difficulty="easy"),
        _q("工作温度范围", "-10°C 至 45°C", category="产品规格", difficulty="hard"),
        _q("产品重量", "约280g（含电池）", category="产品规格", difficulty="easy"),
        _q("保修政策", "自购买日起12个月免费保修", category="售后政策", difficulty="easy"),
    ]


store = QuestionBankStore()


def _collect_categories(questions: list[QuestionRecord]) -> list[str]:
    categories: list[str] = []
    seen: set[str] = set()
    for q in questions:
        if q.category and q.category not in seen:
            seen.add(q.category)
            categories.append(q.category)
    return categories


def _to_question_response(record: QuestionRecord) -> QuestionResponse:
    return QuestionResponse(
        id=record.id,
        question=record.question,
        expected_answer=record.expected_answer,
        category=record.category,
        difficulty=record.difficulty,
        source_ref=record.source_ref,
    )


def _to_bank_response(record: QuestionBankRecord) -> QuestionBankResponse:
    return QuestionBankResponse(
        id=record.id,
        name=record.name,
        type=record.type,
        question_count=len(record.questions),
        categories=_collect_categories(record.questions),
        created_at=record.created_at,
    )


def _to_bank_detail(record: QuestionBankRecord) -> QuestionBankDetailResponse:
    base = _to_bank_response(record)
    return QuestionBankDetailResponse(
        **base.model_dump(),
        questions=[_to_question_response(q) for q in record.questions],
    )


def list_question_banks(
    bank_type: QuestionBankType | None = None,
    search: str | None = None,
) -> tuple[list[QuestionBankResponse], int]:
    items = [_to_bank_response(b) for b in store.banks.values()]
    if bank_type:
        items = [item for item in items if item.type == bank_type]
    if search:
        keyword = search.lower()
        items = [
            item
            for item in items
            if keyword in item.name.lower()
            or any(keyword in cat.lower() for cat in item.categories)
        ]
    items.sort(key=lambda x: (x.type != "builtin", -x.created_at.timestamp()))
    return items, len(items)


def get_question_bank(bank_id: str) -> QuestionBankDetailResponse | None:
    record = store.banks.get(bank_id)
    if not record:
        return None
    return _to_bank_detail(record)


def delete_question_bank(bank_id: str) -> tuple[bool, str | None]:
    record = store.banks.get(bank_id)
    if not record:
        return False, None
    if record.type == "builtin":
        return False, "内置题库不可删除"
    del store.banks[bank_id]
    return True, None


def get_csv_template() -> str:
    return CSV_TEMPLATE


def _normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _parse_csv_row(
    row_num: int,
    row: dict[str, str],
) -> tuple[QuestionRecord | None, SkippedRow | None]:
    question = (row.get("question") or "").strip()
    expected_answer = (row.get("expected_answer") or "").strip()

    if not question and not expected_answer:
        return None, None

    if not question:
        return None, SkippedRow(row=row_num, reason="question 不能为空")
    if not expected_answer:
        return None, SkippedRow(row=row_num, reason="expected_answer 不能为空")

    difficulty_raw = _normalize_optional(row.get("difficulty"))
    difficulty: QuestionDifficulty | None = None
    if difficulty_raw:
        lowered = difficulty_raw.lower()
        if lowered not in VALID_DIFFICULTIES:
            return None, SkippedRow(
                row=row_num,
                reason=f"difficulty 无效，仅支持 easy/medium/hard，收到: {difficulty_raw}",
            )
        difficulty = lowered  # type: ignore[assignment]

    return (
        QuestionRecord(
            id=f"q-{uuid.uuid4().hex[:10]}",
            question=question,
            expected_answer=expected_answer,
            category=_normalize_optional(row.get("category")),
            difficulty=difficulty,
            source_ref=_normalize_optional(row.get("source_ref")),
        ),
        None,
    )


def import_question_bank_csv(
    content: str | bytes,
    name: str | None = None,
) -> ImportQuestionBankResponse:
    if isinstance(content, bytes):
        text = content.decode("utf-8-sig")
    else:
        text = content.lstrip("\ufeff")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ValueError("CSV 文件为空或缺少表头")

    normalized_fields = {f.strip().lower(): f for f in reader.fieldnames if f}
    missing = [col for col in REQUIRED_COLUMNS if col not in normalized_fields]
    if missing:
        raise ValueError(f"CSV 缺少必填列: {', '.join(missing)}")

    questions: list[QuestionRecord] = []
    skipped_rows: list[SkippedRow] = []

    for row_num, raw_row in enumerate(reader, start=2):
        row = {
            key: raw_row.get(original, "") or ""
            for key, original in normalized_fields.items()
        }
        question, skipped = _parse_csv_row(row_num, row)
        if skipped:
            skipped_rows.append(skipped)
        elif question:
            questions.append(question)

    if not questions:
        raise ValueError("CSV 中没有有效的题目数据")

    now = datetime.now(timezone.utc)
    bank_name = (name or "").strip() or f"自定义题库 {now.strftime('%Y%m%d-%H%M%S')}"
    record = QuestionBankRecord(
        id=f"qb-{uuid.uuid4().hex[:12]}",
        name=bank_name,
        type="custom",
        questions=questions,
        created_at=now,
    )
    store.banks[record.id] = record

    return ImportQuestionBankResponse(
        bank=_to_bank_response(record),
        imported_count=len(questions),
        skipped_rows=skipped_rows,
    )
