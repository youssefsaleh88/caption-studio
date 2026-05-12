import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes import transcribe, export_video, upload  # noqa: E402

app = FastAPI(title="Caption Studio API", version="1.0.0")


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


ALLOWED_ORIGINS = _split_csv(
    os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:4173",
    )
)
ALLOWED_ORIGIN_REGEX = os.getenv(
    "ALLOWED_ORIGIN_REGEX",
    r"https://.*\.vercel\.app",
).strip()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe.router, prefix="/api")
app.include_router(export_video.router, prefix="/api")
app.include_router(upload.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
