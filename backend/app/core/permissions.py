from sqlalchemy.orm import Session
from uuid import UUID
from app.models.file import File
from app.models.folder import Folder
from app.models.share import Share, ResourceType

def get_accessible_file(file_id: UUID, user_id: UUID, db: Session, require_editor: bool = False):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        return None
    if file.owner_id == user_id:
        return file
    share = db.query(Share).filter(
        Share.resource_type == ResourceType.file,
        Share.resource_id == file_id,
        Share.shared_with_id == user_id
    ).first()
    if not share:
        return None
    if require_editor and share.permission != "editor":
        return None
    return file

def get_accessible_folder(folder_id: UUID, user_id: UUID, db: Session, require_editor: bool = False):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        return None
    if folder.owner_id == user_id:
        return folder
    share = db.query(Share).filter(
        Share.resource_type == ResourceType.folder,
        Share.resource_id == folder_id,
        Share.shared_with_id == user_id
    ).first()
    if not share:
        return None
    if require_editor and share.permission != "editor":
        return None
    return folder