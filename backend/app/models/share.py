from sqlalchemy import Column, String, DateTime, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base

class PermissionLevel(str, enum.Enum):
    viewer = "viewer"
    editor = "editor"

class ResourceType(str, enum.Enum):
    file = "file"
    folder = "folder"

class Share(Base):
    __tablename__ = "shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_type = Column(Enum(ResourceType), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    shared_with_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    permission = Column(Enum(PermissionLevel), nullable=False, default=PermissionLevel.viewer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", foreign_keys=[owner_id], back_populates="shares_created")
    shared_with = relationship("User", foreign_keys=[shared_with_id], back_populates="shares_received")