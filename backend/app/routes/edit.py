import os
import subprocess
import zipfile
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.pandoc import PANDOC
from app.config import UPLOAD_DIR

router = APIRouter()


@router.get("/edit/{job_id}")
def get_epub_content(job_id: str):
    epub_path = os.path.join(UPLOAD_DIR, f"{job_id}.epub")
    if not os.path.exists(epub_path):
        raise HTTPException(status_code=404, detail="변환된 파일이 없습니다.")

    result = subprocess.run(
        [PANDOC, epub_path, "-t", "html", "--syntax-highlighting=none"],
        capture_output=True, timeout=30,
    )
    html_text = result.stdout.decode("utf-8", errors="replace")
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace")
        raise HTTPException(status_code=500, detail=f"파싱 오류: {stderr}")

    return {"html": html_text, "meta": _extract_meta(epub_path)}


def _extract_meta(epub_path: str) -> dict:
    try:
        with zipfile.ZipFile(epub_path) as z:
            opf_name = next((n for n in z.namelist() if n.endswith(".opf")), None)
            if not opf_name:
                return {}
            content = z.read(opf_name).decode("utf-8")
        import re
        def find(tag: str) -> str:
            m = re.search(rf"<dc:{tag}[^>]*>(.*?)</dc:{tag}>", content, re.DOTALL)
            return m.group(1).strip() if m else ""
        return {
            "title": find("title"),
            "creator": find("creator"),
            "language": find("language"),
            "description": find("description"),
        }
    except Exception:
        return {}


class SaveRequest(BaseModel):
    html: str
    meta: dict


@router.post("/edit/{job_id}/save")
def save_and_export(job_id: str, body: SaveRequest):
    epub_out = os.path.join(UPLOAD_DIR, f"{job_id}.epub")
    html_tmp = os.path.join(UPLOAD_DIR, f"{job_id}_edit.html")

    title = body.meta.get("title", "Untitled")
    author = body.meta.get("creator", "")

    with open(html_tmp, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{title}</title></head>
<body>{body.html}</body></html>""")

    args = [PANDOC, html_tmp, "-o", epub_out,
            "--epub-chapter-level=2", "--toc",
            f"--metadata=title:{title}"]
    if author:
        args.append(f"--metadata=author:{author}")

    result = subprocess.run(args, capture_output=True, text=True, timeout=60)
    if os.path.exists(html_tmp):
        os.remove(html_tmp)

    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"저장 오류: {result.stderr}")

    return {"status": "saved", "download_url": f"/api/download/{job_id}"}
