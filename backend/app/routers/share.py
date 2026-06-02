from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.share import Share, ResourceType
from app.models.user import User
from app.schemas.share import ShareCreate, ShareResponse
from app.routers.auth import get_current_user
from app.core.permissions import get_accessible_file, get_accessible_folder

router = APIRouter(prefix="/shares", tags=["shares"])

@router.post("/", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
def create_share(payload: ShareCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recipient = db.query(User).filter(User.email == payload.shared_with_email).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")
    if payload.resource_type == ResourceType.file:
        resource = get_accessible_file(payload.resource_id, current_user.id, db)
    else:
        resource = get_accessible_folder(payload.resource_id, current_user.id, db)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    existing = db.query(Share).filter(
        Share.resource_type == payload.resource_type,
        Share.resource_id == payload.resource_id,
        Share.shared_with_id == recipient.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already shared with this user")
    share = Share(
        resource_type=payload.resource_type,
        resource_id=payload.resource_id,
        owner_id=current_user.id,
        shared_with_id=recipient.id,
        permission=payload.permission
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return share

@router.get("/shared-with-me", response_model=list[ShareResponse])
def shared_with_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Share).filter(Share.shared_with_id == current_user.id).all()

@router.get("/my-shares", response_model=list[ShareResponse])
def my_shares(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Share).filter(Share.owner_id == current_user.id).all()

@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share(share_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    share = db.query(Share).filter(
        Share.id == share_id,
        Share.owner_id == current_user.id
    ).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    db.delete(share)
    db.commit()