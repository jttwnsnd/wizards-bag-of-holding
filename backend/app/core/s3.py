import boto3
from botocore.config import Config
from app.core.config import settings

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        config=Config(signature_version='s3v4')
    )

def get_public_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_PUBLIC_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        config=Config(signature_version='s3v4')
    )

def generate_upload_url(s3_key: str) -> str:
    client = get_public_s3_client()
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": s3_key},
        ExpiresIn=900
    )

def generate_download_url(s3_key: str) -> str:
    client = get_public_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": s3_key},
        ExpiresIn=300
    )

def delete_object(s3_key: str) -> None:
    client = get_s3_client()
    client.delete_object(Bucket=settings.S3_BUCKET, Key=s3_key)