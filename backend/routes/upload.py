from fastapi import APIRouter
from pydantic import BaseModel

from services.r2_service import create_upload_url

router = APIRouter()


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str


@router.post("/upload-url")
async def get_upload_url(req: UploadUrlRequest):
    payload = create_upload_url(req.filename, req.content_type)
    return payload
