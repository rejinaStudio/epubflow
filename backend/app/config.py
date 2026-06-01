import os

# 파일 저장 경로: 환경변수 UPLOAD_DIR > /tmp/uploads
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 허용 프론트엔드 도메인 (쉼표 구분)
_origins_raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _origins_raw.split(",") if o.strip()]
