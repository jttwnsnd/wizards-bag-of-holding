from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class UploadInitRequest(BaseModel):
    filename: str
    size: int
    mime_type: str
    folder_id: UUID

class UploadInitResponse(BaseModel):
    presigned_url: str
    s3_key: str

class UploadCompleteRequest(BaseModel):
    s3_key: str
    filename: str
    size: int
    mime_type: str
    folder_id: UUID

class FileRename(BaseModel):
    name: str

class FileMove(BaseModel):
    folder_id: UUID

class FileResponse(BaseModel):
    id: UUID
    name: str
    owner_id: UUID
    folder_id: UUID
    s3_key: str
    size: int
    mime_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

class SearchResult(BaseModel):
    id: UUID
    name: str
    mime_type: str
    size: int
    created_at: datetime
    similarity: float

    class Config:
        from_attributes = True