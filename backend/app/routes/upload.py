from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth import get_current_admin

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_SIZE_BYTES = 10 * 1024 * 1024


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin),
):
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Max size is 10MB")

    upload_dir = Path("uploads") / "projects"
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{extension}"
    destination = upload_dir / filename
    destination.write_bytes(content)

    return {
        "url": f"/uploads/projects/{filename}",
        "filename": filename,
        "size": len(content),
    }
