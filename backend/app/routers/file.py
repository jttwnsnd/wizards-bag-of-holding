from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID, uuid4
from app.core.embeddings import generate_embedding, build_file_text
from app.database import get_db
from app.models.file import File
from app.models.folder import Folder
from app.schemas.file import (
    UploadInitRequest, UploadInitResponse,
    UploadCompleteRequest, FileResponse,
    FileRename, FileMove, SearchRequest, SearchResult
)
from app.routers.auth import get_current_user
from app.models.user import User
from app.core.s3 import generate_upload_url, generate_download_url, delete_object

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload/init", response_model=UploadInitResponse)
def upload_init(payload: UploadInitRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(
        Folder.id == payload.folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    ext = payload.filename.rsplit(".", 1)[-1] if "." in payload.filename else ""
    s3_key = f"uploads/{uuid4()}.{ext}" if ext else f"uploads/{uuid4()}"
    presigned_url = generate_upload_url(s3_key)
    return {"presigned_url": presigned_url, "s3_key": s3_key}

@router.post("/upload/complete", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_complete(payload: UploadCompleteRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(
        Folder.id == payload.folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Generate embedding for semantic search
    try:
        text = build_file_text(payload.filename, payload.mime_type)
        embedding = await generate_embedding(text)
    except Exception as e:
        print(f"Warning: failed to generate embedding: {e}")
        embedding = None

    file = File(
        name=payload.filename,
        owner_id=current_user.id,
        folder_id=payload.folder_id,
        s3_key=payload.s3_key,
        size=payload.size,
        mime_type=payload.mime_type,
        embedding=embedding
    )
    db.add(file)
    db.commit()
    db.refresh(file)
    return file

@router.get("/{file_id}/download")
def download_file(file_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    url = generate_download_url(file.s3_key)
    return {"download_url": url}

@router.get("/folder/{folder_id}", response_model=list[FileResponse])
def list_files(folder_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return db.query(File).filter(File.folder_id == folder_id).all()

@router.patch("/{file_id}/rename", response_model=FileResponse)
def rename_file(file_id: UUID, payload: FileRename, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    file.name = payload.name
    db.commit()
    db.refresh(file)
    return file

@router.patch("/{file_id}/move", response_model=FileResponse)
def move_file(file_id: UUID, payload: FileMove, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    folder = db.query(Folder).filter(
        Folder.id == payload.folder_id,
        Folder.owner_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Destination folder not found")
    file.folder_id = payload.folder_id
    db.commit()
    db.refresh(file)
    return file

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    delete_object(file.s3_key)
    db.delete(file)
    db.commit()

@router.get("/storage", response_model=dict)
def get_storage_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import func
    total = db.query(func.sum(File.size)).filter(File.owner_id == current_user.id).scalar()
    return {"used": total or 0}

@router.post("/search", response_model=list[SearchResult])
async def search_files(
    payload: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        query_embedding = await generate_embedding(payload.query)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Embedding service unavailable: {e}")

    results = db.execute(
        text("""
            SELECT id, name, mime_type, size, created_at,
                   1 - (embedding <=> :embedding) AS similarity
            FROM files
            WHERE owner_id = :owner_id
              AND embedding IS NOT NULL
              AND 1 - (embedding <=> :embedding) > 0.5
            ORDER BY embedding <=> :embedding
            LIMIT :limit
        """),
        {
            "embedding": str(query_embedding),
            "owner_id": str(current_user.id),
            "limit": payload.limit
        }
    ).fetchall()

    return [
        SearchResult(
            id=row.id,
            name=row.name,
            mime_type=row.mime_type,
            size=row.size,
            created_at=row.created_at,
            similarity=row.similarity
        )
        for row in results
    ]