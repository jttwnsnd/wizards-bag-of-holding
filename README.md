# 🧙 Wizard's Bag of Holding

A full-stack Google Drive clone with AI-powered semantic search — built to demonstrate cloud-native architecture, modern backend engineering, and practical machine learning integration.

**🔗 Live Demo: [jt-townsend.dev](http://jt-townsend.dev)**
> Log in with `demo@bagofholding.dev` / `demo1234` to explore with pre-loaded data.

**📁 [View Source on GitHub](https://github.com/your-username/wizards-bag-of-holding)**

---

## What It Does

Wizard's Bag of Holding is a fully functional cloud file storage application. Users can upload, organize, and share files — and find them again using natural language search powered by AI embeddings.

The standout feature: **semantic search**. Instead of matching exact filenames, the search understands meaning. Searching *"budget spreadsheet"* can surface a file called *"Q3_finances.xlsx"* — even though none of those words match. This is powered by a locally-running AI embeddings model (no external API required).

---

## Features

- **Drag and drop file uploads** — files go directly to object storage via presigned URLs, bypassing the server entirely
- **Nested folder system** — create, navigate, and organize folders with breadcrumb navigation
- **AI-powered semantic search** — find files by concept, not just filename
- **Sharing and permissions** — share files or folders with viewer or editor access
- **JWT authentication** — stateless, secure auth with protected routes
- **Real-time storage indicator** — live usage tracking in the sidebar
- **Fully containerized** — the entire stack runs with a single `docker compose up`

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | FastAPI + Python 3.12 | High-performance async API, automatic docs |
| Frontend | React 19 + TypeScript + Vite | Type-safe, fast dev experience |
| Styling | Tailwind CSS | Utility-first, no CSS files |
| Database | PostgreSQL 16 + pgvector | Relational data + vector similarity search in one place |
| Object Storage | MinIO (S3-compatible) | Self-hosted S3 — swap to AWS S3 with one config change |
| Embeddings | Ollama (nomic-embed-text) | Local AI inference, no API key or cost |
| ORM / Migrations | SQLAlchemy + Alembic | Type-safe models, version-controlled schema |
| Infrastructure | Docker Compose | Five services, one command |

---

## Architecture Highlights

### Presigned URL Upload Flow
Files never touch the API server. Instead, the backend issues a short-lived signed URL and the browser uploads directly to object storage. This keeps the API stateless and makes the system naturally scalable.

```
Browser → POST /files/upload/init     → API generates presigned PUT URL
Browser → PUT file bytes              → directly to MinIO/S3
Browser → POST /files/upload/complete → API writes metadata to Postgres
```

### Semantic Search Pipeline
```
Upload:  filename + mime_type → Ollama → 768-dim vector → stored in pgvector
Search:  query text → Ollama → query vector → cosine similarity → top results
```

Embeddings are stored directly in PostgreSQL using the pgvector extension — no separate vector database needed.

### Folder Structure
Folders use an adjacency list — a self-referencing foreign key where each folder points to its parent. Simple, readable, and listing a folder's contents is a single `WHERE parent_id = X` query.

### Sharing Model
A polymorphic join table handles both file and folder shares with a `resource_type` discriminator column. Ownership and access are deliberately separated — ownership never changes, access is additive.

---

## Running Locally

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/your-username/wizards-bag-of-holding.git
cd wizards-bag-of-holding
```

### 2. Create environment files

**Root `.env`:**
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=bag_of_holding
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
FRONTEND_URL=http://localhost:5173
```

**`backend/.env`:**
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
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`:**
```env
VITE_API_URL=http://localhost:8000
```

### 3. Start the stack

```bash
docker compose up --build
```

Five services start automatically: FastAPI backend, React frontend, PostgreSQL, MinIO, and Ollama.

### 4. First-time setup

```bash
# Run database migrations
docker compose exec backend alembic upgrade head

# Pull the AI embeddings model (~270MB, persists across restarts)
docker compose exec ollama ollama pull nomic-embed-text

# Create the MinIO bucket
# Log in to http://localhost:9001 (minioadmin / minioadmin) and create a bucket named "bag-of-holding"
```

### 5. Load demo data (optional)

```bash
docker compose cp backend/seeds/seed.py backend:/tmp/seed.py
docker compose exec backend python3 /tmp/seed.py
```

Demo credentials: `demo@bagofholding.dev` / `demo1234`

### 6. Open the app

Navigate to [http://localhost:5173](http://localhost:5173)

---

## API Reference

Interactive docs available at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user |
| GET | `/folders/root` | Get root folder |
| GET | `/folders/{id}/contents` | List subfolders |
| POST | `/files/upload/init` | Initialize presigned upload |
| POST | `/files/upload/complete` | Save file metadata |
| GET | `/files/folder/{id}` | List files in folder |
| GET | `/files/{id}/download` | Get presigned download URL |
| POST | `/files/search` | Semantic search |
| GET | `/files/storage` | Storage usage |
| POST | `/shares` | Share a resource |
| DELETE | `/shares/{id}` | Revoke a share |

---

## Project Structure

```
wizards-bag-of-holding/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, security, S3, embeddings
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API route handlers
│   │   └── schemas/        # Pydantic request/response schemas
│   ├── migrations/         # Alembic migration history
│   ├── seeds/              # Demo data seed script
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── auth/       # Login, Register
│       │   ├── drive/      # FileGrid, FileCard, DropZone, SearchBar
│       │   ├── layout/     # Sidebar, Layout shell
│       │   └── ui/         # Skeletons, toasts
│       ├── context/        # Auth, Toast providers
│       └── hooks/          # useDrive, useUpload, useSearch, useStorage
├── nginx/                  # Reverse proxy config (production)
└── docker-compose.yml
```

---

## Deployment Notes

The live demo runs on AWS EC2 (t3.medium) with Nginx as a reverse proxy. Switching from MinIO to AWS S3 requires only environment variable changes — no code changes. The same applies to swapping Ollama for a cloud embeddings provider like Voyage AI or OpenAI.

---

## Known Limitations

- Embeddings index filenames and MIME types only, not file contents. Full-text search would require an async content extraction pipeline.
- Embedding generation is synchronous at upload time. A production system would offload this to a background job queue (Celery, ARQ).
- The sharing system is fully implemented in the backend but the frontend UI is not yet wired up.

---

## License

MIT