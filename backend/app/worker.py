import os
import subprocess
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
UPLOAD_DIR = "/tmp/uploads"

celery_app = Celery("epubflow", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.task_serializer = "json"


@celery_app.task(bind=True, name="convert_to_epub")
def convert_to_epub(self, job_id: str, input_path: str, original_name: str):
    output_path = os.path.join(UPLOAD_DIR, f"{job_id}.epub")

    try:
        result = subprocess.run(
            [
                "pandoc",
                input_path,
                "-o", output_path,
                "--epub-chapter-level=2",
                "--toc",
                "--toc-depth=3",
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            raise RuntimeError(f"Pandoc 오류: {result.stderr}")

        if not os.path.exists(output_path):
            raise RuntimeError("변환 결과 파일이 생성되지 않았습니다.")

        return {"job_id": job_id, "output": output_path}

    except subprocess.TimeoutExpired:
        raise RuntimeError("변환 시간이 초과되었습니다 (2분).")
    finally:
        # 입력 파일 정리
        if os.path.exists(input_path):
            os.remove(input_path)
