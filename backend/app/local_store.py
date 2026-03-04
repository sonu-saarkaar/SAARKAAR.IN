import json
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional
from uuid import uuid4

_STORE_PATH = Path("uploads") / "resume_requests_fallback.json"
_LOCK = Lock()


def _ensure_store_file() -> None:
    _STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not _STORE_PATH.exists():
        _STORE_PATH.write_text("[]", encoding="utf-8")


def _load_items() -> List[Dict[str, Any]]:
    _ensure_store_file()
    raw = _STORE_PATH.read_text(encoding="utf-8").strip() or "[]"
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_items(items: List[Dict[str, Any]]) -> None:
    _ensure_store_file()
    _STORE_PATH.write_text(
        json.dumps(
            items,
            ensure_ascii=False,
            indent=2,
            default=lambda obj: obj.isoformat() if hasattr(obj, "isoformat") else str(obj),
        ),
        encoding="utf-8",
    )


def list_resume_requests() -> List[Dict[str, Any]]:
    with _LOCK:
        items = _load_items()
    return sorted(items, key=lambda x: str(x.get("created_at", "")), reverse=True)


def list_resume_requests_by_email(email: str) -> List[Dict[str, Any]]:
    email_l = (email or "").lower()
    return [x for x in list_resume_requests() if str(x.get("email", "")).lower() == email_l]


def get_latest_resume_request_by_email(email: str) -> Optional[Dict[str, Any]]:
    rows = list_resume_requests_by_email(email)
    return rows[0] if rows else None


def create_resume_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "_id": str(uuid4()),
        "name": payload.get("name", ""),
        "email": payload.get("email", ""),
        "contact_number": payload.get("contact_number"),
        "organization": payload.get("organization"),
        "resume_type": payload.get("resume_type", "Technical Resume"),
        "reason": payload.get("reason", ""),
        "status": payload.get("status", "pending"),
        "token": payload.get("token"),
        "expires_at": payload.get("expires_at"),
        "download_count": int(payload.get("download_count", 0) or 0),
        "last_downloaded": payload.get("last_downloaded"),
        "ip_address": payload.get("ip_address"),
        "user_agent": payload.get("user_agent"),
        "created_at": payload.get("created_at") or now_iso,
        "reject_reason": payload.get("reject_reason"),
    }
    with _LOCK:
        items = _load_items()
        items.append(doc)
        _save_items(items)
    return doc


def update_resume_request(req_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    with _LOCK:
        items = _load_items()
        for index, item in enumerate(items):
            if str(item.get("_id")) == str(req_id):
                item.update(updates)
                items[index] = item
                _save_items(items)
                return item
    return None


def approve_resume_request(req_id: str) -> Optional[Dict[str, Any]]:
    token = secrets.token_hex(16)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    return update_resume_request(req_id, {"status": "approved", "token": token, "expires_at": expires_at, "reject_reason": None})


def reject_resume_request(req_id: str, reason: str = "Access denied by administrator.") -> Optional[Dict[str, Any]]:
    return update_resume_request(req_id, {"status": "rejected", "reject_reason": reason, "token": None, "expires_at": None})


def find_resume_request_by_token(token: str) -> Optional[Dict[str, Any]]:
    for item in list_resume_requests():
        if item.get("token") == token and item.get("status") == "approved":
            return item
    return None


def increment_download(req_id: str) -> Optional[Dict[str, Any]]:
    now_iso = datetime.now(timezone.utc).isoformat()
    with _LOCK:
        items = _load_items()
        for index, item in enumerate(items):
            if str(item.get("_id")) == str(req_id):
                item["download_count"] = int(item.get("download_count", 0) or 0) + 1
                item["last_downloaded"] = now_iso
                items[index] = item
                _save_items(items)
                return item
    return None
