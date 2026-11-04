
from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

app = FastAPI(
    title="File Organizer API",
    description="Upload, organize, view and download files.",
    version="1.0.0"
)

# Allow the React frontend to communicate with FastAPI
app.add_middleware(
CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://python-file-organizer-chi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage location
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"

CATEGORIES = {
    "Images": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    "Audio": [".mp3", ".wav", ".aac", ".ogg", ".m4a"],
    "Documents": [".pdf", ".doc", ".docx", ".txt", ".ppt",
                  ".pptx", ".xls", ".xlsx", ".csv"],
    "Videos": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
}

for category in list(CATEGORIES) + ["Others"]:
    (UPLOAD_DIR / category).mkdir(parents=True, exist_ok=True)


def get_category(filename: str) -> str:
    extension = Path(filename).suffix.lower()

    for category, extensions in CATEGORIES.items():
        if extension in extensions:
            return category

    return "Others"


def get_file_info(path: Path) -> dict:
    category = path.parent.name

    return {
        "id": path.name,
        "name": path.name,
        "category": category,
        "size": path.stat().st_size,
        "size_kb": round(path.stat().st_size / 1024, 2),
    }


@app.get("/")
def home():
    return {"message": "File Organizer API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    uploaded = []

    for file in files:
        original_name = Path(file.filename or "").name

        if not original_name:
            continue

        category = get_category(original_name)
        destination_folder = UPLOAD_DIR / category

        # Give each uploaded file a unique name
        safe_name = f"{uuid4().hex[:8]}_{original_name}"
        destination = destination_folder / safe_name

        try:
            with destination.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            uploaded.append(get_file_info(destination))

        finally:
            await file.close()

    return {
        "message": f"{len(uploaded)} file(s) uploaded and organized.",
        "files": uploaded,
    }


@app.get("/files")
def list_files():
    result = []

    for category in list(CATEGORIES) + ["Others"]:
        folder = UPLOAD_DIR / category

        for path in folder.iterdir():
            if path.is_file():
                result.append(get_file_info(path))

    return result


@app.get("/download/{category}/{filename}")
def download_file(category: str, filename: str):
    if category not in list(CATEGORIES) + ["Others"]:
        raise HTTPException(status_code=400, detail="Invalid category")

    file_path = UPLOAD_DIR / category / filename

    if not file_path.is_file() or file_path.parent != UPLOAD_DIR / category:
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )


@app.delete("/files/{category}/{filename}")
def delete_file(category: str, filename: str):
    if category not in list(CATEGORIES) + ["Others"]:
        raise HTTPException(status_code=400, detail="Invalid category")

    file_path = UPLOAD_DIR / category / filename

    if not file_path.is_file() or file_path.parent != UPLOAD_DIR / category:
        raise HTTPException(status_code=404, detail="File not found")

    file_path.unlink()

    return {"message": "File deleted successfully"}
