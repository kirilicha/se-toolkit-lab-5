from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.item import ItemRecord
from app.models.interaction import InteractionLog
from app.models.learner import Learner

router = APIRouter()


def _lab_title_fragment(lab: str) -> str:
    parts = lab.strip().lower().split("-")
    if len(parts) == 2 and parts[0] == "lab":
        return f"Lab {parts[1].zfill(2)}"
    return lab


async def _task_ids_for_lab(session: AsyncSession, lab: str) -> list[int]:
    frag = _lab_title_fragment(lab)

    lab_item = (
        await session.exec(
            select(ItemRecord).where(ItemRecord.type == "lab", ItemRecord.title.contains(frag))
        )
    ).first()

    if lab_item is None or lab_item.id is None:
        raise HTTPException(status_code=404, detail="Lab not found")

    rows = (
        await session.exec(
            select(ItemRecord.id).where(
                ItemRecord.parent_id == lab_item.id,
                ItemRecord.type == "task",
            )
        )
    ).all()

    return [rid for rid in rows if rid is not None]


@router.get("/scores")
async def get_scores(
    lab: str = Query(..., description="Lab identifier, e.g. 'lab-01'"),
    session: AsyncSession = Depends(get_session),
):
    task_ids = await _task_ids_for_lab(session, lab)
    if not task_ids:
        return [
            {"bucket": "0-25", "count": 0},
            {"bucket": "26-50", "count": 0},
            {"bucket": "51-75", "count": 0},
            {"bucket": "76-100", "count": 0},
        ]

    bucket = case(
        (InteractionLog.score <= 25, "0-25"),
        (InteractionLog.score <= 50, "26-50"),
        (InteractionLog.score <= 75, "51-75"),
        else_="76-100",
    ).label("bucket")

    stmt = (
        select(bucket, func.count(InteractionLog.id))
        .where(
            InteractionLog.item_id.in_(task_ids),
            InteractionLog.score.is_not(None),
        )
        .group_by(bucket)
    )

    rows = (await session.exec(stmt)).all()

    counts = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
    for b, c in rows:
        counts[str(b)] = int(c)

    return [{"bucket": k, "count": counts[k]} for k in ("0-25", "26-50", "51-75", "76-100")]


@router.get("/pass-rates")
async def get_pass_rates(
    lab: str = Query(..., description="Lab identifier, e.g. 'lab-01'"),
    session: AsyncSession = Depends(get_session),
):
    task_ids = await _task_ids_for_lab(session, lab)
    if not task_ids:
        return []

    stmt = (
        select(
            ItemRecord.title,
            func.avg(InteractionLog.score),
            func.count(InteractionLog.id),
        )
        .join(InteractionLog, InteractionLog.item_id == ItemRecord.id)
        .where(ItemRecord.id.in_(task_ids))
        .group_by(ItemRecord.title)
        .order_by(ItemRecord.title)
    )

    rows = (await session.exec(stmt)).all()

    out = []
    for title, avg_score, attempts in rows:
        avg = 0.0 if avg_score is None else round(float(avg_score), 1)
        out.append({"task": title, "avg_score": avg, "attempts": int(attempts)})
    return out


@router.get("/timeline")
async def get_timeline(
    lab: str = Query(..., description="Lab identifier, e.g. 'lab-01'"),
    session: AsyncSession = Depends(get_session),
):
    task_ids = await _task_ids_for_lab(session, lab)
    if not task_ids:
        return []

    d = func.date(InteractionLog.created_at).label("date")
    stmt = (
        select(d, func.count(InteractionLog.id))
        .where(InteractionLog.item_id.in_(task_ids))
        .group_by(d)
        .order_by(d)
    )

    rows = (await session.exec(stmt)).all()
    return [{"date": str(date), "submissions": int(cnt)} for date, cnt in rows]


@router.get("/groups")
async def get_groups(
    lab: str = Query(..., description="Lab identifier, e.g. 'lab-01'"),
    session: AsyncSession = Depends(get_session),
):
    task_ids = await _task_ids_for_lab(session, lab)
    if not task_ids:
        return []

    stmt = (
        select(
            Learner.student_group,
            func.avg(InteractionLog.score),
            func.count(func.distinct(InteractionLog.learner_id)),
        )
        .join(Learner, Learner.id == InteractionLog.learner_id)
        .where(InteractionLog.item_id.in_(task_ids))
        .group_by(Learner.student_group)
        .order_by(Learner.student_group)
    )

    rows = (await session.exec(stmt)).all()

    out = []
    for group, avg_score, students in rows:
        avg = 0.0 if avg_score is None else round(float(avg_score), 1)
        out.append({"group": group, "avg_score": avg, "students": int(students)})
    return out
