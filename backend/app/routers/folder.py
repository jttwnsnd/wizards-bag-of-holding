from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.database import get_db
from app.models.folder import Folder
from app.schemas.folder import FolderCreate, FolderRename, FolderResponse
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/folders", tags=["folders"])

@router.get("/root", response_model=FolderResponse)
def get_root(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.parent_id == None
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Root folder not found")
    return folder

@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder(folder_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder

@router.get("/{folder_id}/contents", response_model=list[FolderResponse])
def get_contents(folder_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return db.query(Folder).filter(Folder.parent_id == folder_id).all()

@router.post("/", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(payload: FolderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.parent_id:
        parent = db.query(Folder).filter(
            Folder.id == payload.parent_id,
            Folder.owner_id == current_user.id
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
    folder = Folder(
        name=payload.name,
        owner_id=current_user.id,
        parent_id=payload.parent_id
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

@router.patch("/{folder_id}", response_model=FolderResponse)
def rename_folder(folder_id: UUID, payload: FolderRename, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    folder.name = payload.name
    db.commit()
    db.refresh(folder)
    return folder

@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(folder_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    db.delete(folder)
    db.commit()