from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, folder, file, share

app = FastAPI(title="Wizard's Bag of Holding")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(folder.router)
app.include_router(file.router)
app.include_router(share.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}