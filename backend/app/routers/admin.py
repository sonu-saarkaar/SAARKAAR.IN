from datetime import datetime, timezone
import time
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import create_admin_token, get_current_admin, verify_admin_credentials
from app.database import (
    admin_activity_collection,
    chat_logs_collection,
    health_snapshots_collection,
    portfolio_collection,
    project_helper,
    resume_collection,
)
from app.models import AdminHealthResponse, AdminLoginRequest, AdminLoginResponse, CreateProject, UpdateProject

router = APIRouter()
START_TIME = time.time()


def _normalize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    normalized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            normalized[key] = str(value)
        elif isinstance(value, datetime):
            normalized[key] = value.isoformat()
        else:
            normalized[key] = value
    return normalized


async def _log_admin_activity(admin_username: str, action: str, meta: Optional[Dict[str, Any]] = None):
    try:
        await admin_activity_collection.insert_one({
            "admin": admin_username,
            "action": action,
            "meta": meta or {},
            "created_at": datetime.now(timezone.utc),
        })
    except Exception:
        return


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest):
    if not verify_admin_credentials(payload.username, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")

    token = create_admin_token(payload.username, expires_minutes=720)
    await _log_admin_activity(payload.username, "admin_login")
    return AdminLoginResponse(token=token, expires_in_minutes=720)


@router.get("/me")
async def admin_me(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    return {
        "username": current_admin.get("sub"),
        "role": current_admin.get("role"),
        "issued_at": current_admin.get("iat"),
        "expires_at": current_admin.get("exp"),
    }


@router.get("/dashboard/summary")
async def dashboard_summary(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    day_ago = now.timestamp() - 86400

    async def safe_count(collection, query):
        try:
            return await collection.count_documents(query)
        except Exception:
            return 0

    total_projects = await safe_count(portfolio_collection, {})
    total_chat_logs = await safe_count(chat_logs_collection, {})
    total_resume_requests = await safe_count(resume_collection, {})
    pending_resume_requests = await safe_count(resume_collection, {"status": "pending"})
    last_24h_chat_logs = await safe_count(chat_logs_collection, {"created_at_ts": {"$gte": day_ago}})

    return {
        "projects": total_projects,
        "chat_logs": total_chat_logs,
        "chat_logs_last_24h": last_24h_chat_logs,
        "resume_requests": total_resume_requests,
        "pending_resume_requests": pending_resume_requests,
    }


@router.get("/conversations")
async def admin_conversations(
    session_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    current_admin: Dict[str, Any] = Depends(get_current_admin),
):
    query: Dict[str, Any] = {}
    if session_id:
        query["session_id"] = session_id

    docs: List[Dict[str, Any]] = []
    try:
        cursor = chat_logs_collection.find(query).sort("created_at", -1).limit(limit)
        async for item in cursor:
            docs.append(_normalize_doc(item))
    except Exception:
        return []

    return docs


@router.get("/conversations/sessions")
async def admin_conversation_sessions(
    limit: int = Query(default=100, ge=1, le=300),
    current_admin: Dict[str, Any] = Depends(get_current_admin),
):
    pipeline = [
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": "$session_id",
                "message_count": {"$sum": 1},
                "last_message": {"$first": "$user_message"},
                "last_seen": {"$first": "$created_at"},
                "last_partner": {"$first": "$current_partner"},
            }
        },
        {"$sort": {"last_seen": -1}},
        {"$limit": limit},
    ]

    sessions = []
    try:
        async for row in chat_logs_collection.aggregate(pipeline):
            sessions.append({
                "session_id": row.get("_id") or "unknown",
                "message_count": row.get("message_count", 0),
                "last_message": row.get("last_message", ""),
                "last_seen": row.get("last_seen"),
                "last_partner": row.get("last_partner", "unknown"),
            })
    except Exception:
        return []

    return sessions


@router.get("/portfolio")
async def admin_get_portfolio(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    projects = []
    try:
        async for project in portfolio_collection.find().sort("_id", -1):
            projects.append(project_helper(project))
    except Exception:
        return []
    return projects


@router.post("/portfolio")
async def admin_create_portfolio_item(payload: CreateProject, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    doc = payload.model_dump()
    result = await portfolio_collection.insert_one(doc)
    created = await portfolio_collection.find_one({"_id": result.inserted_id})
    await _log_admin_activity(current_admin.get("sub", "admin"), "portfolio_create", {"project_id": str(result.inserted_id)})
    return project_helper(created)


@router.put("/portfolio/{project_id}")
async def admin_update_portfolio_item(project_id: str, payload: UpdateProject, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")

    update_payload = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_payload:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    result = await portfolio_collection.update_one({"_id": ObjectId(project_id)}, {"$set": update_payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    updated = await portfolio_collection.find_one({"_id": ObjectId(project_id)})
    await _log_admin_activity(current_admin.get("sub", "admin"), "portfolio_update", {"project_id": project_id})
    return project_helper(updated)


@router.delete("/portfolio/{project_id}")
async def admin_delete_portfolio_item(project_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")

    result = await portfolio_collection.delete_one({"_id": ObjectId(project_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "portfolio_delete", {"project_id": project_id})
    return {"message": "Project deleted"}


@router.get("/resume-requests")
async def admin_resume_requests(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    items = []
    try:
        async for req in resume_collection.find().sort("created_at", -1):
            items.append(_normalize_doc(req))
    except Exception:
        return []
    return items


@router.post("/resume-requests/{req_id}/approve")
async def admin_approve_resume(req_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    result = await resume_collection.update_one({"_id": req_id}, {"$set": {"status": "approved"}})
    if result.matched_count == 0:
        try:
            if ObjectId.is_valid(req_id):
                result = await resume_collection.update_one({"_id": ObjectId(req_id)}, {"$set": {"status": "approved"}})
        except Exception:
            pass

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "resume_approve", {"request_id": req_id})
    return {"message": "Approved"}


@router.post("/resume-requests/{req_id}/reject")
async def admin_reject_resume(req_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    result = await resume_collection.update_one({"_id": req_id}, {"$set": {"status": "rejected"}})
    if result.matched_count == 0:
        try:
            if ObjectId.is_valid(req_id):
                result = await resume_collection.update_one({"_id": ObjectId(req_id)}, {"$set": {"status": "rejected"}})
        except Exception:
            pass

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "resume_reject", {"request_id": req_id})
    return {"message": "Rejected"}


@router.get("/health", response_model=AdminHealthResponse)
async def admin_health(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    db_connected = True
    try:
        await portfolio_collection.database.command("ping")
    except Exception:
        db_connected = False

    payload = AdminHealthResponse(
        status="healthy" if db_connected else "degraded",
        uptime_seconds=round(time.time() - START_TIME, 2),
        db_connected=db_connected,
        checked_at=datetime.now(timezone.utc),
    )

    try:
        await health_snapshots_collection.insert_one(payload.model_dump())
    except Exception:
        pass
    return payload


@router.get("/health/history")
async def admin_health_history(
    limit: int = Query(default=30, ge=1, le=200),
    current_admin: Dict[str, Any] = Depends(get_current_admin),
):
    items: List[Dict[str, Any]] = []
    try:
        cursor = health_snapshots_collection.find().sort("checked_at", -1).limit(limit)
        async for row in cursor:
            items.append(_normalize_doc(row))
    except Exception:
        return []
    return items


@router.get("/activity")
async def admin_activity_log(
    limit: int = Query(default=100, ge=1, le=300),
    current_admin: Dict[str, Any] = Depends(get_current_admin),
):
    logs = []
    try:
        async for row in admin_activity_collection.find().sort("created_at", -1).limit(limit):
            logs.append(_normalize_doc(row))
    except Exception:
        return []
    return logs
