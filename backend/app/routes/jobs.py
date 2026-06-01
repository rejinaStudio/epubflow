from fastapi import APIRouter, HTTPException
from app.worker import celery_app

router = APIRouter()


@router.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    result = celery_app.AsyncResult(job_id)

    state_map = {
        "PENDING": "queued",
        "STARTED": "processing",
        "SUCCESS": "done",
        "FAILURE": "error",
    }

    status = state_map.get(result.state, "processing")
    response = {"job_id": job_id, "status": status}

    if result.state == "FAILURE":
        response["error"] = str(result.result)
    elif result.state == "SUCCESS":
        response["download_url"] = f"/api/download/{job_id}"

    return response
