from datetime import datetime, timezone
import time
from typing import Any, Dict, List, Optional
from collections import Counter

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import create_admin_token, get_current_admin, verify_admin_credentials
from app.database import (
    admin_activity_collection,
    admin_settings_collection,
    chat_logs_collection,
    feedback_collection,
    health_snapshots_collection,
    join_requests_collection,
    media_assets_collection,
    portfolio_collection,
    project_helper,
    resume_collection,
    appointments_collection,
    system_config_collection,
)
from app.models import AdminHealthResponse, AdminLoginRequest, AdminLoginResponse, CreateProject, UpdateProject
from app.local_store import (
    approve_resume_request,
    list_resume_requests,
    reject_resume_request,
    update_resume_request,
)

router = APIRouter()
START_TIME = time.time()


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _is_in_date_window(item: Dict[str, Any], from_dt: Optional[datetime], to_dt: Optional[datetime]) -> bool:
    if not from_dt and not to_dt:
        return True
    raw = item.get("created_at")
    if isinstance(raw, datetime):
        created_dt = raw
    elif isinstance(raw, str):
        created_dt = _parse_iso(raw)
    else:
        created_dt = None
    if not created_dt:
        return False
    if from_dt and created_dt < from_dt:
        return False
    if to_dt and created_dt > to_dt:
        return False
    return True


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

    if total_resume_requests == 0:
        fallback_rows = list_resume_requests()
        total_resume_requests = len(fallback_rows)
        pending_resume_requests = len([x for x in fallback_rows if str(x.get("status", "")).lower() == "pending"])

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
    search: Optional[str] = Query(default=None),
    user: Optional[str] = Query(default=None),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    current_admin: Dict[str, Any] = Depends(get_current_admin),
):
    query: Dict[str, Any] = {}
    if session_id:
        query["session_id"] = session_id
    if user:
        query["$or"] = [
            {"session_id": {"$regex": user, "$options": "i"}},
            {"user_message": {"$regex": user, "$options": "i"}},
        ]

    from_dt = _parse_iso(from_date)
    to_dt = _parse_iso(to_date)

    docs: List[Dict[str, Any]] = []
    try:
        cursor = chat_logs_collection.find(query).sort("created_at", -1).limit(limit)
        async for item in cursor:
            normalized = _normalize_doc(item)
            if search:
                searchable = f"{normalized.get('user_message', '')} {normalized.get('assistant_response', '')}".lower()
                if search.lower() not in searchable:
                    continue
            if not _is_in_date_window(normalized, from_dt, to_dt):
                continue
            docs.append(normalized)
    except Exception:
        return []

    return docs


@router.delete("/conversations/{conversation_id}")
async def admin_delete_conversation(conversation_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    query = {"_id": ObjectId(conversation_id)} if ObjectId.is_valid(conversation_id) else {"_id": conversation_id}
    result = await chat_logs_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "conversation_delete", {"conversation_id": conversation_id})
    return {"message": "Conversation deleted"}


@router.post("/conversations/{conversation_id}/flag")
async def admin_flag_conversation(conversation_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    query = {"_id": ObjectId(conversation_id)} if ObjectId.is_valid(conversation_id) else {"_id": conversation_id}
    result = await chat_logs_collection.update_one(query, {"$set": {"flagged": True, "flagged_at": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "conversation_flag", {"conversation_id": conversation_id})
    return {"message": "Conversation flagged"}


@router.post("/conversations/{conversation_id}/important")
async def admin_mark_conversation_important(conversation_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    query = {"_id": ObjectId(conversation_id)} if ObjectId.is_valid(conversation_id) else {"_id": conversation_id}
    result = await chat_logs_collection.update_one(query, {"$set": {"important": True, "important_at": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "conversation_mark_important", {"conversation_id": conversation_id})
    return {"message": "Conversation marked important"}


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


@router.get("/users")
async def admin_users(
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None),
    tag: Optional[str] = Query(default=None),
    limit: int = Query(default=300, ge=1, le=1000),
    current_admin: Dict[str, Any] = Depends(get_current_admin),
):
    try:
        profile_doc = await admin_settings_collection.find_one({"_id": "user_profiles"}) or {}
    except Exception:
        profile_doc = {}
    profile_map = profile_doc.get("profiles", {}) if isinstance(profile_doc.get("profiles", {}), dict) else {}

    users: Dict[str, Dict[str, Any]] = {}

    try:
        cursor = chat_logs_collection.find({}, {"session_id": 1, "created_at": 1, "created_at_ts": 1}).sort("created_at", -1).limit(limit * 5)
        async for row in cursor:
            session_id = row.get("session_id") or "anonymous"
            item = users.setdefault(session_id, {
                "id": session_id,
                "name": session_id,
                "email": "not_provided@saarkaar.local",
                "status": "active",
                "tag": "Student",
                "resume_requested": False,
                "conversation_count": 0,
                "last_login": row.get("created_at"),
                "ip_address": "unknown",
                "device_info": "web",
            })
            item["conversation_count"] += 1
            if row.get("created_at") and (not item.get("last_login") or row.get("created_at") > item.get("last_login")):
                item["last_login"] = row.get("created_at")
    except Exception:
        pass

    try:
        async for req in resume_collection.find({}, {"email": 1, "name": 1, "created_at": 1, "ip_address": 1, "user_agent": 1}):
            key = (req.get("email") or req.get("name") or "resume_user").lower()
            item = users.setdefault(key, {
                "id": key,
                "name": req.get("name") or key,
                "email": req.get("email") or "not_provided@saarkaar.local",
                "status": "active",
                "tag": "Recruiter",
                "resume_requested": True,
                "conversation_count": 0,
                "last_login": req.get("created_at"),
                "ip_address": req.get("ip_address") or "unknown",
                "device_info": req.get("user_agent") or "web",
            })
            item["resume_requested"] = True
            if req.get("ip_address"):
                item["ip_address"] = req.get("ip_address")
            if req.get("user_agent"):
                item["device_info"] = req.get("user_agent")
    except Exception:
        pass

    normalized_users = []
    for uid, row in users.items():
        profile = profile_map.get(uid, {}) if isinstance(profile_map, dict) else {}
        merged = {
            **row,
            "status": profile.get("status", row.get("status", "active")),
            "tag": profile.get("tag", row.get("tag", "Student")),
            "soft_deleted": profile.get("soft_deleted", False),
        }
        normalized_users.append(_normalize_doc(merged))

    if search:
        q = search.lower()
        normalized_users = [u for u in normalized_users if q in str(u.get("name", "")).lower() or q in str(u.get("email", "")).lower() or q in str(u.get("id", "")).lower()]
    if status_filter:
        normalized_users = [u for u in normalized_users if str(u.get("status", "")).lower() == status_filter.lower()]
    if tag:
        normalized_users = [u for u in normalized_users if str(u.get("tag", "")).lower() == tag.lower()]

    normalized_users.sort(key=lambda x: str(x.get("last_login", "")), reverse=True)
    return normalized_users[:limit]


@router.post("/users/{user_id}/status")
async def admin_user_status(user_id: str, payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    next_status = payload.get("status", "active")
    doc = await admin_settings_collection.find_one({"_id": "user_profiles"}) or {"_id": "user_profiles", "profiles": {}}
    profiles = doc.get("profiles", {}) if isinstance(doc.get("profiles", {}), dict) else {}
    profile = profiles.get(user_id, {})
    profile["status"] = next_status
    profiles[user_id] = profile
    await admin_settings_collection.update_one({"_id": "user_profiles"}, {"$set": {"profiles": profiles}}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "user_status_update", {"user_id": user_id, "status": next_status})
    return {"message": "User status updated"}


@router.post("/users/{user_id}/tag")
async def admin_user_tag(user_id: str, payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    next_tag = payload.get("tag", "Student")
    doc = await admin_settings_collection.find_one({"_id": "user_profiles"}) or {"_id": "user_profiles", "profiles": {}}
    profiles = doc.get("profiles", {}) if isinstance(doc.get("profiles", {}), dict) else {}
    profile = profiles.get(user_id, {})
    profile["tag"] = next_tag
    profiles[user_id] = profile
    await admin_settings_collection.update_one({"_id": "user_profiles"}, {"$set": {"profiles": profiles}}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "user_tag_update", {"user_id": user_id, "tag": next_tag})
    return {"message": "User tag updated"}


@router.post("/users/{user_id}/soft-delete")
async def admin_user_soft_delete(user_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    doc = await admin_settings_collection.find_one({"_id": "user_profiles"}) or {"_id": "user_profiles", "profiles": {}}
    profiles = doc.get("profiles", {}) if isinstance(doc.get("profiles", {}), dict) else {}
    profile = profiles.get(user_id, {})
    profile["soft_deleted"] = True
    profile["status"] = "blocked"
    profiles[user_id] = profile
    await admin_settings_collection.update_one({"_id": "user_profiles"}, {"$set": {"profiles": profiles}}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "user_soft_delete", {"user_id": user_id})
    return {"message": "User soft deleted"}


@router.delete("/users/{user_id}")
async def admin_user_permanent_delete(user_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    await chat_logs_collection.delete_many({"session_id": user_id})
    await resume_collection.delete_many({"email": user_id})
    await _log_admin_activity(current_admin.get("sub", "admin"), "user_permanent_delete", {"user_id": user_id})
    return {"message": "User data permanently deleted where matched"}


@router.get("/analytics")
async def admin_analytics(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    now_ts = datetime.now(timezone.utc).timestamp()
    day_windows = [now_ts - (i * 86400) for i in range(0, 7)]

    daily = []
    for i in range(6, -1, -1):
        start_ts = day_windows[i]
        end_ts = start_ts + 86400
        try:
            count = await chat_logs_collection.count_documents({"created_at_ts": {"$gte": start_ts, "$lt": end_ts}})
        except Exception:
            count = 0
        daily.append({"label": f"Day-{6 - i + 1}", "value": count})

    category_counter = Counter()
    try:
        async for project in portfolio_collection.find({}, {"category": 1}):
            category_counter[project.get("category") or "General"] += 1
    except Exception:
        pass

    top_questions = Counter()
    try:
        async for chat in chat_logs_collection.find({}, {"user_message": 1}).limit(800):
            msg = (chat.get("user_message") or "").strip()
            if msg:
                top_questions[msg[:90]] += 1
    except Exception:
        pass

    try:
        unique_visitors = len(await chat_logs_collection.distinct("session_id"))
    except Exception:
        unique_visitors = 0

    return {
        "daily_interactions": daily,
        "project_interest": [{"name": k, "value": v} for k, v in category_counter.items()] or [{"name": "General", "value": 1}],
        "top_questions": [{"question": q, "count": c} for q, c in top_questions.most_common(8)],
        "unique_visitors": unique_visitors,
        "resume_conversion_rate": round((await resume_collection.count_documents({}) / unique_visitors) * 100, 2) if unique_visitors else 0,
        "top_sections": [
            {"name": "Portfolio", "value": 42},
            {"name": "AI Chat", "value": 33},
            {"name": "Resume", "value": 17},
            {"name": "Projects", "value": 8},
        ],
    }


@router.get("/system/status")
async def admin_system_status(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    db_connected = True
    try:
        await portfolio_collection.database.command("ping")
    except Exception:
        db_connected = False

    uptime_seconds = round(time.time() - START_TIME, 2)
    return {
        "backend_api": "healthy",
        "ai_api": "healthy",
        "database": "healthy" if db_connected else "critical",
        "server_cpu": 31,
        "memory_usage": 58,
        "storage_usage": 62,
        "response_time_ms": 118,
        "uptime_percent": 99.91,
        "uptime_seconds": uptime_seconds,
        "db_connected": db_connected,
        "system_load": 0.42,
    }


@router.get("/maintenance")
async def admin_get_maintenance(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    try:
        doc = await admin_settings_collection.find_one({"_id": "maintenance"}) or {}
    except Exception:
        doc = {}
    return {
        "enabled": doc.get("enabled", False),
        "message": doc.get("message", "Scheduled maintenance in progress."),
        "schedule": doc.get("schedule"),
        "allow_admin_bypass": doc.get("allow_admin_bypass", True),
    }


@router.put("/maintenance")
async def admin_set_maintenance(payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    update_payload = {
        "enabled": bool(payload.get("enabled", False)),
        "message": payload.get("message", "Scheduled maintenance in progress."),
        "schedule": payload.get("schedule"),
        "allow_admin_bypass": bool(payload.get("allow_admin_bypass", True)),
        "updated_at": datetime.now(timezone.utc),
    }
    await admin_settings_collection.update_one({"_id": "maintenance"}, {"$set": update_payload}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "maintenance_update", update_payload)
    return {"message": "Maintenance configuration updated"}


@router.get("/ai-config")
async def admin_get_ai_config(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    try:
        doc = await admin_settings_collection.find_one({"_id": "ai_config"}) or {}
    except Exception:
        doc = {}
    return {
        "model": doc.get("model", "gpt-4o"),
        "temperature": doc.get("temperature", 0.7),
        "token_limit": doc.get("token_limit", 600),
        "system_prompt": doc.get("system_prompt", "Default SAARKAAR AI prompt"),
        "voice_enabled": doc.get("voice_enabled", True),
        "chat_memory_enabled": doc.get("chat_memory_enabled", True),
    }


@router.put("/ai-config")
async def admin_set_ai_config(payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    update_payload = {
        "model": payload.get("model", "gpt-4o"),
        "temperature": float(payload.get("temperature", 0.7)),
        "token_limit": int(payload.get("token_limit", 600)),
        "system_prompt": payload.get("system_prompt", "Default SAARKAAR AI prompt"),
        "voice_enabled": bool(payload.get("voice_enabled", True)),
        "chat_memory_enabled": bool(payload.get("chat_memory_enabled", True)),
        "updated_at": datetime.now(timezone.utc),
    }
    await admin_settings_collection.update_one({"_id": "ai_config"}, {"$set": update_payload}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "ai_config_update", {"model": update_payload["model"]})
    return {"message": "AI configuration updated"}


@router.get("/feature-toggles")
async def admin_get_feature_toggles(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    try:
        doc = await admin_settings_collection.find_one({"_id": "feature_toggles"}) or {}
    except Exception:
        doc = {}
    return doc.get("toggles", {
        "voice_chat": True,
        "resume_download": True,
        "maintenance_banner": False,
        "investor_mode": True,
        "analytics_heatmap": True,
    })


@router.put("/feature-toggles")
async def admin_set_feature_toggles(payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    toggles = payload.get("toggles", {})
    await admin_settings_collection.update_one({"_id": "feature_toggles"}, {"$set": {"toggles": toggles, "updated_at": datetime.now(timezone.utc)}}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "feature_toggle_update", {"count": len(toggles)})
    return {"message": "Feature toggles updated"}


@router.get("/content")
async def admin_get_content(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    try:
        doc = await admin_settings_collection.find_one({"_id": "content_manager"}) or {}
    except Exception:
        doc = {}
    return doc.get("content", {
        "founder_story": "",
        "about": "",
        "skills": "",
        "experience": "",
        "education": "",
        "testimonials": "",
        "contact_info": "",
        "hero_text": "",
        "virtual_office_dialogues": "",
    })


@router.put("/content")
async def admin_set_content(payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    content = payload.get("content", {})
    await admin_settings_collection.update_one({"_id": "content_manager"}, {"$set": {"content": content, "updated_at": datetime.now(timezone.utc)}}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "content_update", {"keys": list(content.keys())[:10]})
    return {"message": "Content updated"}


@router.get("/office-settings")
async def admin_get_office_settings(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    try:
        doc = await admin_settings_collection.find_one({"_id": "office_settings"}) or {}
    except Exception:
        doc = {}
    return doc.get("settings", {
        "welcome_message": "Welcome to SAARKAAR Virtual Office",
        "voice_assistant_enabled": True,
        "lobby_music_enabled": True,
        "safe_mode_default": False,
        "office_theme": "dark-gold",
    })


@router.put("/office-settings")
async def admin_set_office_settings(payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    settings = payload.get("settings", {})
    await admin_settings_collection.update_one({"_id": "office_settings"}, {"$set": {"settings": settings, "updated_at": datetime.now(timezone.utc)}}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "office_settings_update", {"keys": list(settings.keys())[:10]})
    return {"message": "Office settings updated"}


@router.get("/system-config")
async def admin_get_system_config(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    try:
        doc = await system_config_collection.find_one({"_id": "main"}) or {}
    except Exception:
        doc = {}
    return {
        "maintenanceMode": bool(doc.get("maintenanceMode", False)),
        "aiEnabled": bool(doc.get("aiEnabled", True)),
        "voiceEnabled": bool(doc.get("voiceEnabled", True)),
        "heroText": doc.get("heroText", ""),
        "contactEmail": doc.get("contactEmail", ""),
        "themeColor": doc.get("themeColor", "#D4AF37"),
        "updatedAt": doc.get("updatedAt"),
    }


@router.put("/system-config")
async def admin_set_system_config(payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    update_payload = {
        "maintenanceMode": bool(payload.get("maintenanceMode", False)),
        "aiEnabled": bool(payload.get("aiEnabled", True)),
        "voiceEnabled": bool(payload.get("voiceEnabled", True)),
        "heroText": payload.get("heroText", ""),
        "contactEmail": payload.get("contactEmail", ""),
        "themeColor": payload.get("themeColor", "#D4AF37"),
        "updatedAt": datetime.now(timezone.utc),
    }
    await system_config_collection.update_one({"_id": "main"}, {"$set": update_payload}, upsert=True)
    await _log_admin_activity(current_admin.get("sub", "admin"), "system_config_update", {"keys": list(update_payload.keys())})
    return {"message": "System configuration updated", **update_payload}


@router.get("/media")
async def admin_media_list(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    assets = []
    try:
        async for asset in media_assets_collection.find().sort("created_at", -1):
            assets.append(_normalize_doc(asset))
    except Exception:
        return []
    return assets


@router.post("/media")
async def admin_media_add(payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    doc = {
        "name": payload.get("name", "asset"),
        "type": payload.get("type", "image"),
        "url": payload.get("url", ""),
        "folder": payload.get("folder", "general"),
        "usage": payload.get("usage", "manual"),
        "created_at": datetime.now(timezone.utc),
    }
    result = await media_assets_collection.insert_one(doc)
    await _log_admin_activity(current_admin.get("sub", "admin"), "media_add", {"asset_id": str(result.inserted_id)})
    created = await media_assets_collection.find_one({"_id": result.inserted_id})
    return _normalize_doc(created)


@router.delete("/media/{asset_id}")
async def admin_media_delete(asset_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    query = {"_id": ObjectId(asset_id)} if ObjectId.is_valid(asset_id) else {"_id": asset_id}
    result = await media_assets_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media asset not found")
    await _log_admin_activity(current_admin.get("sub", "admin"), "media_delete", {"asset_id": asset_id})
    return {"message": "Media asset deleted"}


@router.get("/security")
async def admin_security_overview(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    attempts = []
    try:
        async for row in admin_activity_collection.find({"action": {"$in": ["admin_login", "admin_login_failed"]}}).sort("created_at", -1).limit(200):
            attempts.append(_normalize_doc(row))
    except Exception:
        pass

    blocked_users = 0
    profiles_doc = await admin_settings_collection.find_one({"_id": "user_profiles"}) or {}
    profiles = profiles_doc.get("profiles", {}) if isinstance(profiles_doc.get("profiles", {}), dict) else {}
    for p in profiles.values():
        if p.get("status") == "blocked":
            blocked_users += 1

    return {
        "two_fa_enabled": False,
        "blocked_users": blocked_users,
        "ip_block_list": ["none"],
        "login_attempt_logs": attempts,
        "permissions": ["admin:full"],
    }


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
        fallback_rows = list_resume_requests()
        return [_normalize_doc(x) for x in fallback_rows]
    return items


@router.post("/resume-requests/{req_id}/approve")
async def admin_approve_resume(req_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    try:
        result = await resume_collection.update_one({"_id": req_id}, {"$set": {"status": "approved"}})
        if result.matched_count == 0:
            try:
                if ObjectId.is_valid(req_id):
                    result = await resume_collection.update_one({"_id": ObjectId(req_id)}, {"$set": {"status": "approved"}})
            except Exception:
                pass

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Request not found")
    except HTTPException:
        raise
    except Exception:
        updated = approve_resume_request(req_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "resume_approve", {"request_id": req_id})
    return {"message": "Approved"}


@router.post("/resume-requests/{req_id}/reject")
async def admin_reject_resume(req_id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    try:
        result = await resume_collection.update_one({"_id": req_id}, {"$set": {"status": "rejected"}})
        if result.matched_count == 0:
            try:
                if ObjectId.is_valid(req_id):
                    result = await resume_collection.update_one({"_id": ObjectId(req_id)}, {"$set": {"status": "rejected"}})
            except Exception:
                pass

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Request not found")
    except HTTPException:
        raise
    except Exception:
        updated = reject_resume_request(req_id, "Access denied by administrator.")
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "resume_reject", {"request_id": req_id})
    return {"message": "Rejected"}


@router.put("/resume-requests/{req_id}")
async def admin_update_resume_request(req_id: str, payload: Dict[str, Any], current_admin: Dict[str, Any] = Depends(get_current_admin)):
    update_payload: Dict[str, Any] = {}
    if payload.get("status"):
        update_payload["status"] = payload.get("status")
    if payload.get("note") is not None:
        update_payload["admin_note"] = payload.get("note")
    if payload.get("expiry_hours") is not None:
        try:
            hours = int(payload.get("expiry_hours"))
            update_payload["expires_at"] = datetime.now(timezone.utc).timestamp() + (hours * 3600)
        except Exception:
            pass
    if payload.get("revoke"):
        update_payload["status"] = "revoked"

    if not update_payload:
        raise HTTPException(status_code=400, detail="No update fields provided")

    try:
        result = await resume_collection.update_one({"_id": req_id}, {"$set": update_payload})
        if result.matched_count == 0 and ObjectId.is_valid(req_id):
            result = await resume_collection.update_one({"_id": ObjectId(req_id)}, {"$set": update_payload})

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Request not found")
    except HTTPException:
        raise
    except Exception:
        updated = update_resume_request(req_id, update_payload)
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")

    await _log_admin_activity(current_admin.get("sub", "admin"), "resume_update", {"request_id": req_id, **update_payload})
    return {"message": "Resume request updated", "email_dispatch": "simulated"}


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
