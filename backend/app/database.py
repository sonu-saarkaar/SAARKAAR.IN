from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime, timezone

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_DETAILS, serverSelectionTimeoutMS=2000)
database = client.saarkaar_db

portfolio_collection = database.get_collection("projects")
feedback_collection = database.get_collection("feedback")
join_requests_collection = database.get_collection("join_requests")
appointments_collection = database.get_collection("appointments")

# Required CMS collections
users_collection = database.get_collection("users")
resume_requests_collection = database.get_collection("resumeRequests")
chat_logs_cms_collection = database.get_collection("chatLogs")
admin_logs_collection = database.get_collection("adminLogs")
system_config_collection = database.get_collection("systemConfig")

# Backward-compatible aliases used by existing modules
resume_collection = resume_requests_collection
chat_logs_collection = chat_logs_cms_collection
admin_activity_collection = admin_logs_collection
health_snapshots_collection = database.get_collection("health_snapshots")
admin_settings_collection = database.get_collection("admin_settings")
media_assets_collection = database.get_collection("media_assets")

# Helper to format MongoDB document to dict
def project_helper(project) -> dict:
    return {
        "id": str(project["_id"]),
        "title": project.get("title", ""),
        "description": project.get("description", ""),
        "longStory": project.get("longStory", project.get("solution", "")),
        "vision": project.get("vision", ""),
        "techStack": project.get("techStack", project.get("tech_stack", [])),
        "status": project.get("status", "upcoming"),
        "teamMembers": project.get("teamMembers", []),
        "images": project.get("images", project.get("gallery", [])),
        "liveUrl": project.get("liveUrl", project.get("live_link")),
        "appUrl": project.get("appUrl"),
        "progressPercentage": project.get("progressPercentage", 0),
        "createdAt": project.get("createdAt") or datetime.now(timezone.utc),
        "updatedAt": project.get("updatedAt") or datetime.now(timezone.utc),

        # Backward-compat fields for current frontend/admin components
        "tagline": project.get("tagline", project.get("title", "")),
        "tech_stack": project.get("tech_stack", project.get("techStack", [])),
        "gallery": project.get("gallery", project.get("images", [])),
        "live_link": project.get("live_link", project.get("liveUrl")),
        "problem_statement": project.get("problem_statement", project.get("description", "")),
        "solution": project.get("solution", project.get("longStory", "")),
        "features": project.get("features", []),
        "client_info": project.get("client_info"),
        "timeline": project.get("timeline"),
        "badge": project.get("badge"),
        "gradient": project.get("gradient"),
        "category": project.get("category", "General"),
    }
