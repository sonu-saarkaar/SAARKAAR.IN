from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from app.database import resume_collection
from app.models import ResumeRequestSchema
from bson import ObjectId
import secrets
from datetime import datetime, timedelta
from app.local_store import (
    approve_resume_request,
    create_resume_request,
    find_resume_request_by_token,
    get_latest_resume_request_by_email,
    increment_download,
    list_resume_requests,
    list_resume_requests_by_email,
    reject_resume_request,
    update_resume_request,
)

router = APIRouter()


def _as_datetime(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None
    return None



# Helper
def resume_helper(req) -> dict:
    return {
        "id": str(req.get("_id") or req.get("id")),
        "name": req.get("name"),
        "email": req.get("email"),
        "organization": req.get("organization"),
        "contact_number": req.get("contact_number"),
        "resume_type": req.get("resume_type"),
        "reason": req.get("reason"),
        "status": req.get("status", "pending"),
        "reject_reason": req.get("reject_reason"),
        "token": req.get("token"),
        "expires_at": req.get("expires_at"),
        "download_count": req.get("download_count", 0),
        "last_downloaded": req.get("last_downloaded"),
        "created_at": req.get("created_at")
    }

@router.post("/request")
async def request_resume(request: Request, schema: ResumeRequestSchema):
    # Capture IP and User Agent
    client_host = request.client.host
    user_agent = request.headers.get("user-agent")
    
    # Check if a pending or approved request already exists for this email
    existing = None
    try:
        existing = await resume_collection.find_one({"email": str(schema.email)})
    except Exception:
        existing = get_latest_resume_request_by_email(str(schema.email))

    if existing:
        status = existing.get("status", "pending")
        if status == "pending":
            return {"message": "Request already pending for this email.", "status": "pending"}
        elif status == "approved":
            # Check if expired
            exp_at = _as_datetime(existing.get("expires_at"))
            if exp_at and datetime.now(exp_at.tzinfo) > exp_at if getattr(exp_at, "tzinfo", None) else datetime.now() > exp_at:
                pass # Allow renewal
            else:
                return {"message": "Access already granted.", "status": "approved"}
    
    req_dict = schema.model_dump()
    req_dict["contact_number"] = req_dict.get("contact_number") or req_dict.get("phone")
    req_dict["resume_type"] = req_dict.get("resume_type") or req_dict.get("documentType") or "Technical Resume (Engineering)"
    req_dict["reason"] = (req_dict.get("reason") or "").strip() or "Resume access request"
    req_dict.pop("phone", None)
    req_dict.pop("documentType", None)
    req_dict["ip_address"] = client_host
    req_dict["user_agent"] = user_agent
    req_dict["download_count"] = 0

    try:
        new_req = await resume_collection.insert_one(req_dict)
        return {"message": "Request submitted successfully. Pending approval.", "id": str(new_req.inserted_id), "status": "pending"}
    except Exception:
        created = create_resume_request(req_dict)
        return {"message": "Request submitted successfully. Pending approval.", "id": str(created.get("_id")), "status": "pending"}

@router.get("/status")
async def check_status_query(email: str):
    return await check_status(email)


@router.get("/status/{email}")
async def check_status(email: str):
    reqs = []
    try:
        cursor = resume_collection.find({"email": email}).sort("created_at", -1).limit(1)
        reqs = await cursor.to_list(length=1)
    except Exception:
        latest = get_latest_resume_request_by_email(email)
        reqs = [latest] if latest else []

    if not reqs:
        raise HTTPException(status_code=404, detail="No request found for this email.")
    req = reqs[0]
    
    # Check if expired
    expires_at = _as_datetime(req.get("expires_at"))
    if req.get("status") == "approved" and expires_at:
        # Make sure datetime is compared correctly depending on tz awareness
        if datetime.now(expires_at.tzinfo) > expires_at if getattr(expires_at, "tzinfo", None) else datetime.now() > expires_at:
            # Update to expired
            try:
                await resume_collection.update_one({"_id": req["_id"]}, {"$set": {"status": "expired"}})
            except Exception:
                update_resume_request(str(req.get("_id")), {"status": "expired"})
            return {"status": "expired", "message": "Access token expired. Please request again."}
            
    return {"status": req.get("status", "pending"), "token": req.get("token"), "reject_reason": req.get("reject_reason")}

@router.get("/history/{email}")
async def get_history(email: str):
    requests = []
    try:
        async for req in resume_collection.find({"email": email}).sort("created_at", -1):
            requests.append(resume_helper(req))
        return requests
    except Exception:
        return [resume_helper(x) for x in list_resume_requests_by_email(email)]

@router.get("/admin/list")
async def list_requests(): # Simple endpoint to fetch all
    requests = []
    try:
        async for req in resume_collection.find().sort("created_at", -1):
            requests.append(resume_helper(req))
        return requests
    except Exception:
        return [resume_helper(x) for x in list_resume_requests()]

@router.post("/admin/approve/{req_id}")
async def approve_request(req_id: str):
    try:
        if not ObjectId.is_valid(req_id):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        obj_id = ObjectId(req_id)

        req = await resume_collection.find_one({"_id": obj_id})
        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        token = secrets.token_hex(16)
        expires = datetime.now() + timedelta(hours=24)

        await resume_collection.update_one(
            {"_id": obj_id},
            {"$set": {"status": "approved", "token": token, "expires_at": expires}}
        )
        return {"message": "Approved", "token": token}
    except HTTPException:
        raise
    except Exception:
        updated = approve_resume_request(req_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")
        return {"message": "Approved", "token": updated.get("token")}

from pydantic import BaseModel
class RejectPayload(BaseModel):
    reason: str = "Access denied by administrator."

@router.post("/admin/reject/{req_id}")
async def reject_request(req_id: str, payload: RejectPayload):
    try:
        if not ObjectId.is_valid(req_id):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        obj_id = ObjectId(req_id)

        await resume_collection.update_one(
            {"_id": obj_id},
            {"$set": {"status": "rejected", "reject_reason": payload.reason, "token": None, "expires_at": None}}
        )
        return {"message": "Rejected"}
    except HTTPException:
        raise
    except Exception:
        updated = reject_resume_request(req_id, payload.reason)
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")
        return {"message": "Rejected"}

@router.get("/download/{token}")
async def download_resume(token: str):
    req = None
    try:
        req = await resume_collection.find_one({"token": token, "status": "approved"})
    except Exception:
        req = find_resume_request_by_token(token)

    if not req:
        raise HTTPException(status_code=403, detail="Invalid or expired token")
        
    expires_at = _as_datetime(req.get("expires_at"))
    if expires_at:
        now = datetime.now(expires_at.tzinfo) if getattr(expires_at, "tzinfo", None) else datetime.now()
        if now > expires_at:
            try:
                await resume_collection.update_one({"_id": req["_id"]}, {"$set": {"status": "expired"}})
            except Exception:
                update_resume_request(str(req.get("_id")), {"status": "expired"})
            raise HTTPException(status_code=403, detail="Token expired")

    # Increment download count and update timestamp
    try:
        await resume_collection.update_one(
            {"_id": req["_id"]},
            {
                "$inc": {"download_count": 1},
                "$set": {"last_downloaded": datetime.now()}
            }
        )
    except Exception:
        increment_download(str(req.get("_id")))
        
    # Return dummy PDF URL or streaming response.
    # In reality, serve a FileResponse. For now, returning a signed proxy link.
    return {
        "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", 
        "filename": f"SAARKAAR_Resume_{req.get('resume_type', 'Secured').replace(' ', '_')}.pdf",
        "message": "Secure payload ready."
    }
