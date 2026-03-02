from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
from app.database import feedback_collection, join_requests_collection, appointments_collection
from app.models import FeedbackSchema, JoinRequestSchema, AppointmentSchema
import os
import shutil
from pathlib import Path
from datetime import datetime

router = APIRouter()

# Serve static uploads if needed, or define in main.py
UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# --- FEEDBACK ---
@router.post("/feedback")
async def submit_feedback(feedback: FeedbackSchema):
    new_feedback = feedback.model_dump()
    result = await feedback_collection.insert_one(new_feedback)
    if result.inserted_id:
        return {"message": "Feedback submitted successfully!", "id": str(result.inserted_id)}
    raise HTTPException(status_code=500, detail="Failed to submit feedback")

# --- JOIN TEAM ---
@router.post("/join")
async def join_team(
    full_name: str = Form(...),
    role: str = Form(...),
    message: str = Form(...),
    portfolio_link: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None)
):
    resume_path = None
    if resume:
        # Validate file type (PDF/Word)
        if resume.content_type not in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            raise HTTPException(status_code=400, detail="Only PDF and Word documents allowed")
        
        # Save file with unique name
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{resume.filename}"
        file_location = UPLOAD_DIR / filename
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(resume.file, buffer)
        resume_path = str(file_location)

    join_request = {
        "full_name": full_name,
        "role": role,
        "portfolio_link": portfolio_link,
        "resume_url": resume_path,
        "message": message,
        "created_at": datetime.now()
    }

    result = await join_requests_collection.insert_one(join_request)
    if result.inserted_id:
        return {"message": "Join request submitted successfully!", "id": str(result.inserted_id)}
    raise HTTPException(status_code=500, detail="Failed to maximize request")

# --- APPOINTMENTS ---
@router.post("/appointments")
async def book_appointment(appointment: AppointmentSchema):
    # Check if slot is taken (basic check)
    existing = await appointments_collection.find_one({"date": appointment.date, "time": appointment.time})
    if existing:
        raise HTTPException(status_code=409, detail="Time slot already booked")

    new_appointment = appointment.model_dump()
    result = await appointments_collection.insert_one(new_appointment)
    if result.inserted_id:
        return {"message": "Appointment booked successfully!", "id": str(result.inserted_id)}
    raise HTTPException(status_code=500, detail="Failed to maximize appointment")
