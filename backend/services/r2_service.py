import os
import uuid
import boto3
from botocore.config import Config
from fastapi import HTTPException


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise HTTPException(status_code=500, detail=f"Missing env var: {name}")
    return value


def get_r2_client():
    account_id = _require_env("R2_ACCOUNT_ID")
    access_key = _require_env("R2_ACCESS_KEY_ID")
    secret_key = _require_env("R2_SECRET_ACCESS_KEY")

    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def create_upload_url(filename: str, content_type: str) -> dict:
    bucket = _require_env("R2_BUCKET")
    public_base = _require_env("R2_PUBLIC_BASE_URL").rstrip("/")
    expires_seconds = int(os.getenv("R2_UPLOAD_URL_EXPIRES_SECONDS", "900"))

    safe_name = filename.replace("\\", "_").replace("/", "_")
    key = f"videos/{uuid.uuid4()}_{safe_name}"

    client = get_r2_client()
    try:
        upload_url = client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                "ContentType": content_type or "application/octet-stream",
            },
            ExpiresIn=expires_seconds,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Could not generate upload URL: {exc}"
        )

    return {
        "upload_url": upload_url,
        "object_key": key,
        "video_url": f"{public_base}/{key}",
    }
