import sys
import asyncio
import httpx
sys.path.insert(0, '/app')

import app.models.user
import app.models.folder
import app.models.share
import app.models.file

from app.database import SessionLocal
from app.models.user import User
from app.models.folder import Folder
from app.models.file import File
from app.core.security import hash_password
from uuid import uuid4
from datetime import datetime, timezone

# ============================================================
# DEMO DATA CONFIGURATION
# ============================================================

DEMO_USER_EMAIL = "demo@bagofholding.dev"
DEMO_USER_PASSWORD = "demo1234"

FOLDERS = [
    {"name": "Work Documents"},
    {"name": "Personal"},
    {"name": "Projects"},
]

# Subfolders: (name, parent_folder_name)
SUBFOLDERS = [
    ("Resumes", "Work Documents"),
    ("Invoices", "Work Documents"),
    ("Photos", "Personal"),
    ("Ideas", "Projects"),
]

# Fake files: (name, mime_type, size_bytes, folder_name)
FILES = [
    ("Q3_Budget_Report.pdf", "application/pdf", 204800, "Work Documents"),
    ("Meeting_Notes_June.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 15360, "Work Documents"),
    ("Resume_2026.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 24576, "Resumes"),
    ("Cover_Letter_Template.pdf", "application/pdf", 10240, "Resumes"),
    ("Invoice_001.pdf", "application/pdf", 8192, "Invoices"),
    ("Invoice_002.pdf", "application/pdf", 8192, "Invoices"),
    ("Vacation_Photo.jpg", "image/jpeg", 3145728, "Photos"),
    ("Profile_Picture.png", "image/png", 512000, "Photos"),
    ("App_Idea_Notes.txt", "text/plain", 2048, "Ideas"),
    ("Architecture_Diagram.png", "image/png", 102400, "Projects"),
    ("battle_theme.mp3", "audio/mpeg", 5242880, "Personal"),
    ("Project_Proposal.pdf", "application/pdf", 51200, "Projects"),
]

# ============================================================

async def generate_embedding(text: str) -> list[float] | None:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://ollama:11434/api/embeddings",
                json={"model": "nomic-embed-text", "prompt": text},
                timeout=30.0
            )
            return response.json()["embedding"]
    except Exception as e:
        print(f"  Warning: could not generate embedding: {e}")
        return None

async def seed():
    db = SessionLocal()

    # ── Demo user ──────────────────────────────────────────
    existing = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if existing:
        print(f"Demo user already exists ({DEMO_USER_EMAIL}), skipping user creation.")
        user = existing
    else:
        user = User(
            email=DEMO_USER_EMAIL,
            hashed_password=hash_password(DEMO_USER_PASSWORD)
        )
        db.add(user)
        db.flush()

        root = Folder(name="My Drive", owner_id=user.id, parent_id=None)
        db.add(root)
        db.flush()
        print(f"✓ Created demo user: {DEMO_USER_EMAIL} / {DEMO_USER_PASSWORD}")

    # ── Get root folder ────────────────────────────────────
    root = db.query(Folder).filter(
        Folder.owner_id == user.id,
        Folder.parent_id == None
    ).first()

    # ── Top-level folders ──────────────────────────────────
    folder_map = {"My Drive": root}
    for f in FOLDERS:
        existing_folder = db.query(Folder).filter(
            Folder.name == f["name"],
            Folder.owner_id == user.id,
            Folder.parent_id == root.id
        ).first()
        if not existing_folder:
            folder = Folder(name=f["name"], owner_id=user.id, parent_id=root.id)
            db.add(folder)
            db.flush()
            folder_map[f["name"]] = folder
            print(f"  ✓ Folder: {f['name']}")
        else:
            folder_map[f["name"]] = existing_folder

    # ── Subfolders ─────────────────────────────────────────
    for name, parent_name in SUBFOLDERS:
        parent = folder_map.get(parent_name)
        if not parent:
            print(f"  ✗ Parent folder '{parent_name}' not found, skipping '{name}'")
            continue
        existing_folder = db.query(Folder).filter(
            Folder.name == name,
            Folder.owner_id == user.id,
            Folder.parent_id == parent.id
        ).first()
        if not existing_folder:
            folder = Folder(name=name, owner_id=user.id, parent_id=parent.id)
            db.add(folder)
            db.flush()
            folder_map[name] = folder
            print(f"  ✓ Subfolder: {name} (inside {parent_name})")
        else:
            folder_map[name] = existing_folder

    # ── Files ──────────────────────────────────────────────
    print("\nGenerating embeddings and creating files...")
    for name, mime_type, size, folder_name in FILES:
        folder = folder_map.get(folder_name)
        if not folder:
            print(f"  ✗ Folder '{folder_name}' not found, skipping '{name}'")
            continue

        existing_file = db.query(File).filter(
            File.name == name,
            File.owner_id == user.id
        ).first()
        if existing_file:
            print(f"  ~ Skipping (exists): {name}")
            continue

        embedding = await generate_embedding(f"{name} {mime_type}")
        s3_key = f"demo/{uuid4()}.{name.rsplit('.', 1)[-1]}"

        file = File(
            name=name,
            owner_id=user.id,
            folder_id=folder.id,
            s3_key=s3_key,
            size=size,
            mime_type=mime_type,
            embedding=embedding,
            created_at=datetime.now(timezone.utc)
        )
        db.add(file)
        db.flush()
        print(f"  ✓ File: {name} ({folder_name})")

    db.commit()
    db.close()
    print("\n✅ Seed complete!")
    print(f"   Login: {DEMO_USER_EMAIL}")
    print(f"   Password: {DEMO_USER_PASSWORD}")

asyncio.run(seed())