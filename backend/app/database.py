from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_DETAILS, serverSelectionTimeoutMS=2000)
database = client.saarkaar_db

portfolio_collection = database.get_collection("projects")
feedback_collection = database.get_collection("feedback")
join_requests_collection = database.get_collection("join_requests")
appointments_collection = database.get_collection("appointments")
resume_collection = database.get_collection("resume_requests")
chat_logs_collection = database.get_collection("chat_logs")
admin_activity_collection = database.get_collection("admin_activity")
health_snapshots_collection = database.get_collection("health_snapshots")

# Helper to format MongoDB document to dict
def project_helper(project) -> dict:
    return {
        "id": str(project["_id"]),
        "title": project["title"],
        "tagline": project["tagline"],
        "description": project["description"],
        "vision": project.get("vision"),
        "status": project["status"],
        "tech_stack": project["tech_stack"],
        "problem_statement": project["problem_statement"],
        "solution": project["solution"],
        "features": project["features"],
        "gallery": project.get("gallery", []),
        "live_link": project.get("live_link"),
        "client_info": project.get("client_info"),
        "timeline": project.get("timeline"),
        "badge": project.get("badge"),
        "gradient": project.get("gradient"),
        "category": project.get("category"),
    }
