from datetime import datetime, timezone
from typing import Any, Dict, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_admin
from app.database import portfolio_collection, project_helper
from app.models import CreateProject, ProjectSchema, UpdateProject

router = APIRouter()


def _to_project_doc(data: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)

    tech_stack = data.get("techStack") or data.get("tech_stack") or []
    images = data.get("images") or data.get("gallery") or []
    long_story = data.get("longStory") or data.get("solution") or ""
    live_url = data.get("liveUrl") or data.get("live_link")

    doc: Dict[str, Any] = {
        "title": data.get("title", "").strip(),
        "description": data.get("description", "").strip(),
        "longStory": long_story,
        "vision": data.get("vision") or "",
        "techStack": tech_stack,
        "status": data.get("status", "upcoming"),
        "teamMembers": data.get("teamMembers", []),
        "images": images,
        "liveUrl": live_url,
        "appUrl": data.get("appUrl"),
        "progressPercentage": int(data.get("progressPercentage", 0) or 0),
        "createdAt": data.get("createdAt") or now,
        "updatedAt": now,

        # Keep legacy keys for existing components
        "tagline": data.get("tagline") or data.get("title", ""),
        "category": data.get("category", "General"),
        "tech_stack": tech_stack,
        "problem_statement": data.get("problem_statement") or data.get("description", ""),
        "solution": data.get("solution") or long_story,
        "features": data.get("features", []),
        "gallery": images,
        "live_link": live_url,
        "client_info": data.get("client_info"),
        "timeline": data.get("timeline"),
        "badge": data.get("badge"),
        "gradient": data.get("gradient"),
    }

    return doc


def _validate_object_id(id_value: str) -> ObjectId:
    if not ObjectId.is_valid(id_value):
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    return ObjectId(id_value)

@router.get("/", response_model=List[ProjectSchema])
async def get_projects():
    projects = []
    try:
        async for project in portfolio_collection.find().sort("updatedAt", -1):
            projects.append(project_helper(project))
        return projects
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(exc)}")

@router.get("/{id}", response_model=ProjectSchema)
async def get_project(id: str):
    project_id = _validate_object_id(id)
    project = await portfolio_collection.find_one({"_id": project_id})
    if project:
        return project_helper(project)
    raise HTTPException(status_code=404, detail="Project not found")

@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def create_project(project: CreateProject, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    project_data = _to_project_doc(project.model_dump(exclude_none=True))
    if not project_data.get("title") or not project_data.get("description"):
        raise HTTPException(status_code=422, detail="title and description are required")

    new_project = await portfolio_collection.insert_one(project_data)
    created_project = await portfolio_collection.find_one({"_id": new_project.inserted_id})
    return project_helper(created_project)


@router.put("/{id}", response_model=ProjectSchema)
async def update_project(id: str, project: UpdateProject, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    project_id = _validate_object_id(id)
    incoming = project.model_dump(exclude_none=True)
    if not incoming:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    current = await portfolio_collection.find_one({"_id": project_id})
    if not current:
        raise HTTPException(status_code=404, detail="Project not found")

    merged = {**current, **incoming}
    update_doc = _to_project_doc(merged)
    update_doc["createdAt"] = current.get("createdAt") or update_doc.get("createdAt")

    await portfolio_collection.update_one({"_id": project_id}, {"$set": update_doc})
    updated_project = await portfolio_collection.find_one({"_id": project_id})
    return project_helper(updated_project)


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_project(id: str, current_admin: Dict[str, Any] = Depends(get_current_admin)):
    project_id = _validate_object_id(id)
    result = await portfolio_collection.delete_one({"_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}
