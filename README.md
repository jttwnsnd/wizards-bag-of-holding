# 🧙 Wizard's Bag of Holding

A full-stack, cloud-native Google Drive clone with AI-powered semantic search. Built with FastAPI, React, PostgreSQL, and MinIO — fully containerized with Docker Compose.

![Demo](docs/demo.png)

---

## Features

- **File management** — upload, download, rename, move, and delete files
- **Folder system** — nested folders with breadcrumb navigation
- **Drag and drop uploads** — drop files directly onto the drive view
- **Presigned URL architecture** — files upload directly to object storage, bypassing the API server
- **Sharing and permissions** — share files and folders with viewer or editor access
- **AI-powered semantic search** — search by meaning, not just filename (powered by local Ollama embeddings + pgvector)
- **JWT authentication** — stateless auth with protected routes
- **Storage indicator** — real-time storage usage in the sidebar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, Alembic, Python 3.12 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Database | PostgreSQL 16 + pgvector extension |
| Object Storage | MinIO (S3-compatible) |
| Embeddings | Ollama (nomic-embed-text model) |
| Infrastructure | Docker Compose |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Node.js](https://nodejs.org/) v18+ (for local frontend development only)
- Git

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/wizards-bag-of-holding.git
cd wizards-bag-of-holding
```

### 2. Create environment files

**Root `.env`** (Docker Compose variable substitution):
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=bag_of_holding
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

**`backend/.env`** (FastAPI runtime config):
```env
DATABASE_URL=postgresql://postgres:yourpassword@db:5432/bag_of_holding
JWT_SECRET=your-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
S3_ENDPOINT_URL=http://minio:9000
S3_PUBLIC_URL=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=bag-of-holding
OLLAMA_URL=http://ollama:11434
```

**`frontend/.env`** (Vite build-time config):
```env
VITE_API_URL=http://localhost:8000
```

### 3. Start the stack

```bash
docker compose up --build
```

This starts five services:
- `backend` → FastAPI API at http://localhost:8000
- `frontend` → React app at http://localhost:5173
- `db` → PostgreSQL at localhost:5432
- `minio` → Object storage API at localhost:9000, Admin UI at http://localhost:9001
- `ollama` → Local embeddings server at localhost:11434

### 4. Run database migrations

```bash
docker compose exec backend alembic upgrade head
```

### 5. Pull the embeddings model

This downloads the `nomic-embed-text` model (~270MB). Only needed once — the model persists in a Docker volume.

```bash
docker compose exec ollama ollama pull nomic-embed-text
```

### 6. Create the MinIO bucket

Log in to the MinIO Admin UI at http://localhost:9001 with `minioadmin` / `minioadmin`, create a bucket named `bag-of-holding`.

### 7. Load demo data (optional)

Seeds a demo user and a realistic folder/file structure with pre-generated embeddings:

```bash
docker compose cp backend/seeds/seed.py backend:/tmp/seed.py
docker compose exec backend python3 /tmp/seed.py
```

Demo credentials:
- **Email:** `demo@bagofholding.dev`
- **Password:** `demo1234`

### 8. Open the app

Navigate to http://localhost:5173 and sign in.

---

## Architecture

### Presigned URL Upload Flow

Files never pass through the API server. Instead:

```
Browser → POST /files/upload/init  → FastAPI generates presigned PUT URL
Browser → PUT file bytes           → directly to MinIO (no API involved)
Browser → POST /files/upload/complete → FastAPI writes metadata to Postgres
```

This keeps the API stateless and makes the system horizontally scalable.

### Semantic Search

```
Upload time:  filename + mime_type → Ollama (nomic-embed-text) → 768-dim vector → stored in pgvector
Search time:  query text → Ollama → query vector → cosine similarity search → top results
```

Searching "budget spreadsheet" can surface "Q3_finances.xlsx" even though none of those words match, because the model understands semantic similarity.

### Folder Structure

Folders are stored as an adjacency list — a self-referencing foreign key where each folder points to its parent. Listing a folder's contents is a single `WHERE parent_id = X` query.

### Sharing Model

Sharing is modeled as a polymorphic join table. One `shares` table handles both file and folder shares using a `resource_type` discriminator column. Ownership and access are deliberately separated — ownership never changes, access is additive via the shares table.

---

## API Reference

Interactive API docs available at http://localhost:8000/docs (Swagger UI).

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login (returns JWT) |
| GET | `/auth/me` | Get current user |
| GET | `/folders/root` | Get root folder |
| GET | `/folders/{id}/contents` | List subfolders |
| POST | `/folders` | Create folder |
| DELETE | `/folders/{id}` | Delete folder |
| POST | `/files/upload/init` | Initialize presigned upload |
| POST | `/files/upload/complete` | Complete upload, save metadata |
| GET | `/files/folder/{id}` | List files in folder |
| GET | `/files/{id}/download` | Get presigned download URL |
| POST | `/files/search` | Semantic search |
| GET | `/files/storage` | Get storage usage |
| POST | `/shares` | Share a file or folder |
| DELETE | `/shares/{id}` | Revoke a share |

---

## Development

### Running the frontend locally (faster hot reload)

```bash
# Start backend services only
docker compose up backend db minio ollama

# Run frontend locally in a separate terminal
cd frontend
npm install
npm run dev
```

### Running database migrations

```bash
# Generate a new migration after model changes
docker compose exec backend alembic revision --autogenerate -m "description"

# Always inspect the generated file before applying
cat backend/migrations/versions/<revision_id>_description.py

# Apply migrations
docker compose exec backend alembic upgrade head
```

### Switching from MinIO to AWS S3

No code changes required — only environment variable changes in `backend/.env`:

```env
S3_ENDPOINT_URL=          # leave blank or remove
S3_PUBLIC_URL=            # leave blank or remove
S3_ACCESS_KEY=<your AWS access key>
S3_SECRET_KEY=<your AWS secret key>
S3_BUCKET=<your bucket name>
AWS_REGION=us-east-1
```

### Switching from Ollama to a cloud embeddings provider

Update `backend/app/core/embeddings.py` to call your provider's API instead of Ollama. The vector column dimension (768) may need to change depending on the model — update the `Vector(768)` column in `backend/app/models/file.py` and run a migration.

---

## Project Structure

```
wizards-bag-of-holding/
├── backend/
│   ├── app/
│   │   ├── core/           # config, security, s3, embeddings
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # FastAPI route handlers
│   │   └── schemas/        # Pydantic request/response schemas
│   ├── migrations/         # Alembic migration files
│   ├── seeds/              # Demo data seed script
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/       # Login, Register pages
│   │   │   ├── drive/      # FileGrid, FileCard, DropZone, SearchBar
│   │   │   ├── layout/     # Sidebar, Layout shell
│   │   │   └── ui/         # SkeletonGrid, SkeletonCard
│   │   ├── context/        # AuthContext, ToastContext
│   │   └── hooks/          # useDrive, useUpload, useSearch, useStorage
│   └── Dockerfile
└── docker-compose.yml
```

---

## Known Limitations

- Embeddings are generated from filename and MIME type only, not file contents. Full-text search would require a content extraction pipeline.
- Embeddings are generated synchronously at upload time. A production system would use a background job queue (Celery, ARQ) to avoid adding latency to uploads.
- The sharing UI is backend-complete but not yet wired into the frontend.
- No file preview — downloads open in a new tab.

---

## License

MIT