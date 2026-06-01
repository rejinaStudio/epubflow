import uuid
import subprocess
import os
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import aiofiles
from app.pandoc import PANDOC
from app.config import UPLOAD_DIR

router = APIRouter()

ALLOWED_EXT = {"docx", "doc", "txt", "html"}

_jobs: dict = {}


def _do_convert(job_id: str, input_path: str, output_path: str):
    _jobs[job_id]["status"] = "processing"
    try:
        result = subprocess.run(
            [PANDOC, input_path, "-o", output_path,
             "--epub-chapter-level=2", "--toc", "--toc-depth=3"],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr)
        _jobs[job_id]["status"] = "done"
    except Exception as e:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(e)
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)


@router.post("/convert")
async def upload_and_convert(file: UploadFile = File(...)):
    ext = ""
    if file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="DOCX, DOC, TXT, HTML 파일만 가능합니다.")

    job_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{job_id}.{ext}")
    output_path = os.path.join(UPLOAD_DIR, f"{job_id}.epub")

    async with aiofiles.open(input_path, "wb") as f:
        await f.write(await file.read())

    _jobs[job_id] = {"status": "queued", "filename": file.filename}

    asyncio.get_event_loop().run_in_executor(
        None, _do_convert, job_id, input_path, output_path
    )

    return {"job_id": job_id, "status": "queued", "filename": file.filename}


@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="존재하지 않는 작업입니다.")
    job = _jobs[job_id].copy()
    job["job_id"] = job_id
    if job["status"] == "done":
        job["download_url"] = f"/api/download/{job_id}"
    return job


@router.get("/download/{job_id}")
def download_epub(job_id: str):
    output_path = os.path.join(UPLOAD_DIR, f"{job_id}.epub")
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    return FileResponse(output_path, media_type="application/epub+zip", filename="converted.epub")
