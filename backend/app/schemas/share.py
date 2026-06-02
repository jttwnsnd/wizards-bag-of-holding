from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from app.models.share import PermissionLevel, ResourceType

class ShareCreate(BaseModel):
    resource_type: ResourceType
    resource_id: UUID
    shared_with_email: EmailStr
    permission: PermissionLevel = PermissionLevel.viewer

class ShareResponse(BaseModel):
    id: UUID
    resource_type: ResourceType
    resource_id: UUID
    owner_id: UUID
    shared_with_id: UUID
    permission: PermissionLevel
    created_at: datetime

    class Config:
        from_attributes = True