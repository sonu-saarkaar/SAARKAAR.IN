from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from app.database import resume_collection
from app.models import ResumeRequestSchema
from bson import ObjectId
import secrets
from datetime import datetime, timedelta

router = APIRouter()

# --- Zero-Dependency In-Memory Store for Portfolio Demo ---
class MockResumeCollection:
    def __init__(self):
        self.docs = []
        self.counter = 1

    async def find_one(self, query, sort=None):
        docs = self.docs
        if sort: # simplified sort support (only works for created_at desc roughly by reversing)
            docs = list(reversed(self.docs))
        
        for doc in docs:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    async def insert_one(self, document):
        document["_id"] = str(self.counter)
        self.counter += 1
        self.docs.append(document)
        class InsertResult:
            def __init__(self, id_val):
                self.inserted_id = id_val
        return InsertResult(document["_id"])

    async def update_one(self, query, update):
        doc = await self.find_one(query)
        if doc:
            if "$set" in update:
                doc.update(update["$set"])
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    doc[k] = doc.get(k, 0) + v

    class AsyncCursor:
        def __init__(self, docs, skip_sort=False):
            self.docs = docs
            self.skip_sort = skip_sort
        def sort(self, key, direction):
            # reverse list for desc
            if direction == -1:
                self.docs = list(reversed(self.docs))
            return self

        async def __aiter__(self):
            for doc in self.docs:
                yield doc
                
    def find(self, query=None):
        if not query:
            return self.AsyncCursor(self.docs.copy())
        matched = []
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(doc)
        return self.AsyncCursor(matched)

# Initialize the mock collection
resume_collection = MockResumeCollection()

# Helper
def resume_helper(req) -> dict:
    return {
        "id": str(req["_id"]),
        "name": req["name"],
        "email": req["email"],
        "organization": req.get("organization"),
        "resume_type": req["resume_type"],
        "reason": req["reason"],
        "status": req.get("status", "pending"),
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
    existing = await resume_collection.find_one({"email": schema.email})
    if existing:
        if existing["status"] == "pending":
            return {"message": "Request already pending for this email.", "status": "pending"}
        elif existing["status"] == "approved":
            # Check if expired
            if existing.get("expires_at") and datetime.now() > existing["expires_at"]:
                pass # Allow renewal
            else:
                return {"message": "Access already granted.", "status": "approved"}
    
    req_dict = schema.dict()
    req_dict["ip_address"] = client_host
    req_dict["user_agent"] = user_agent
    req_dict["download_count"] = 0
    
    new_req = await resume_collection.insert_one(req_dict)
    return {"message": "Request submitted successfully. Pending approval.", "id": str(new_req.inserted_id), "status": "pending"}

@router.get("/status/{email}")
async def check_status(email: str):
    req = await resume_collection.find_one({"email": email}, sort=[("created_at", -1)])
    if not req:
        raise HTTPException(status_code=404, detail="No request found for this email.")
    
    # Check if expired
    if req.get("status") == "approved" and req.get("expires_at"):
        if datetime.now() > req["expires_at"]:
            # Update to expired
            await resume_collection.update_one({"_id": req["_id"]}, {"$set": {"status": "expired"}})
            return {"status": "expired", "message": "Access token expired. Please request again."}
            
    return {"status": req.get("status", "pending"), "token": req.get("token")}

@router.get("/history/{email}")
async def get_history(email: str):
    requests = []
    async for req in resume_collection.find({"email": email}).sort("created_at", -1):
        requests.append(resume_helper(req))
    return requests

@router.get("/admin/list")
async def list_requests(): # Simple endpoint to fetch all
    requests = []
    async for req in resume_collection.find().sort("created_at", -1):
        requests.append(resume_helper(req))
    return requests

@router.post("/admin/approve/{req_id}")
async def approve_request(req_id: str):
    obj_id = req_id # Mock uses string IDs
        
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

@router.post("/admin/reject/{req_id}")
async def reject_request(req_id: str):
    obj_id = req_id # Mock uses string IDs
        
    await resume_collection.update_one(
        {"_id": obj_id},
        {"$set": {"status": "rejected", "token": None, "expires_at": None}}
    )
    return {"message": "Rejected"}

@router.get("/download/{token}")
async def download_resume(token: str):
    req = await resume_collection.find_one({"token": token, "status": "approved"})
    if not req:
        raise HTTPException(status_code=403, detail="Invalid or expired token")
        
    if req.get("expires_at") and datetime.now() > req["expires_at"]:
        await resume_collection.update_one({"_id": req["_id"]}, {"$set": {"status": "expired"}})
        raise HTTPException(status_code=403, detail="Token expired")

    # Increment download count and update timestamp
    await resume_collection.update_one(
        {"_id": req["_id"]}, 
        {
            "$inc": {"download_count": 1},
            "$set": {"last_downloaded": datetime.now()}
        }
    )
        
    # Return dummy PDF URL or streaming response.
    # In reality, serve a FileResponse. For now, returning a signed proxy link.
    return {
        "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", 
        "filename": f"SAARKAAR_Resume_{req.get('resume_type', 'Secured').replace(' ', '_')}.pdf",
        "message": "Secure payload ready."
    }
