from fastapi import APIRouter, HTTPException, status
from typing import List
from app.database import portfolio_collection, project_helper
from app.models import ProjectSchema, CreateProject, UpdateProject
from bson import ObjectId

router = APIRouter()

# Seed Data (The 6 Projects)
INITIAL_PROJECTS = [
    {
        "title": "KYRON",
        "tagline": "AI Digital Execution Agent",
        "category": "AI Automation System",
        "description": "AI-powered digital execution system for form automation, structured workflows and intelligent interaction.",
        "vision": "To create a world where digital execution is autonomous, intelligent, and seamless.",
        "status": "Main Flagship Project",
        "tech_stack": ["React", "Python", "FastAPI", "AI Systems"],
        "badge": "Flagship",
        "problem_statement": "Manual form filling and complex digital workflows are time-consuming and prone to error.",
        "solution": "KYRON uses advanced LLMs and computer vision.",
        "features": ["Autonomous Form Filling", "Multi-step Workflow"],
        "gallery": [],
        "timeline": "2023 - Present",
        "gradient": "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)"
    },
    {
        "title": "KORA / ZYNTO.IN",
        "tagline": "Business Automation Platform",
        "category": "Business Platform",
        "description": "Business automation and digital presence platform.",
        "status": "Live Production",
        "tech_stack": ["React", "Node.js", "MongoDB"],
        "badge": "LIVE – ZYNTO.IN",
        "live_link": "https://zynto.in",
        "problem_statement": "Small businesses lack digital identity.",
        "solution": "Unified platform for website creation.",
        "features": ["Instant Website Builder", "Inventory Management"],
        "gallery": [],
        "timeline": "2023 - Live",
        "gradient": "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
    },
    {
        "title": "Evenza.space",
        "tagline": "Premium Event Management",
        "category": "Marketing & Event Management",
        "description": "Premium event and marketing website.",
        "status": "Sold to MD Sarfealam",
        "tech_stack": ["React", "Branding System"],
        "badge": "Project Acquired",
        "client_info": "MD Sarfealam",
        "problem_statement": "Event management lacks premium digital presence.",
        "solution": "Luxury interface for event discovery.",
        "features": ["Event Showcase", "Booking System"],
        "gallery": [],
        "timeline": "2023",
        "gradient": "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)"
    },
    {
        "title": "BookMyThali",
        "tagline": "Smart Meal Ordering",
        "category": "FoodTech Platform",
        "description": "Smart customizable meal ordering system for students.",
        "status": "Under Development",
        "tech_stack": ["React", "Mobile First"],
        "badge": "Upcoming",
        "problem_statement": "Students struggle with repetitive mess food.",
        "solution": "Granular customization of daily meals.",
        "features": ["Custom Thali Builder", "Subscription Management"],
        "gallery": [],
        "timeline": "Upcoming",
        "gradient": "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)"
    },
    {
        "title": "SAARKAAR Portfolio",
        "tagline": "Immersive 3D Experience",
        "category": "Immersive 3D Experience",
        "description": "AI-powered 3D Virtual Office Experience.",
        "status": "Building Live",
        "tech_stack": ["React", "Three.js", "AI"],
        "badge": "Current",
        "problem_statement": "Traditional portfolios are static.",
        "solution": "Fully immersive 3D environment with AI receptionist.",
        "features": ["3D Virtual Office", "AI Receptionist"],
        "gallery": [],
        "timeline": "2024 - Present",
        "gradient": "linear-gradient(135deg, #2b5876 0%, #4e4376 100%)"
    },
    {
        "title": "Anesetu",
        "tagline": "Confidential Innovation",
        "category": "Innovation Project",
        "description": "Confidential development stage intelligent system.",
        "status": "Coming Soon",
        "tech_stack": ["Advanced AI", "Neural Networks"],
        "badge": "Confidential",
        "problem_statement": "Redacted",
        "solution": "Redacted",
        "features": ["Stealth Development", "Next-Gen AI"],
        "gallery": [],
        "timeline": "Upcoming",
        "gradient": "linear-gradient(135deg, #000000 0%, #434343 100%)"
    }
]

@router.get("/", response_model=List[ProjectSchema])
async def get_projects():
    projects = []
    async for project in portfolio_collection.find():
        projects.append(project_helper(project))
    
    if not projects:
        # Auto-seed if empty
        await portfolio_collection.insert_many(INITIAL_PROJECTS)
        # Fetch again
        async for project in portfolio_collection.find():
            projects.append(project_helper(project))
            
    return projects

@router.get("/{id}", response_model=ProjectSchema)
async def get_project(id: str):
    if not ObjectId.is_valid(id):
         raise HTTPException(status_code=400, detail="Invalid ID format")
         
    project = await portfolio_collection.find_one({"_id": ObjectId(id)})
    if project:
        return project_helper(project)
    raise HTTPException(status_code=404, detail="Project not found")

@router.post("/", response_description="Add new project")
async def create_project(project: CreateProject):
    project_data = project.model_dump()
    new_project = await portfolio_collection.insert_one(project_data)
    created_project = await portfolio_collection.find_one({"_id": new_project.inserted_id})
    return project_helper(created_project)
