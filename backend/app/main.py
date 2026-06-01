from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS
from app.routes import convert, edit

app = FastAPI(title="EPUBFlow API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges", "Content-Length"],
)

app.include_router(convert.router, prefix="/api")
app.include_router(edit.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
