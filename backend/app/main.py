from fastapi import FastAPI
from app.routers import auth, folder

app = FastAPI(title="Wizard's Bag of Holding")

app.include_router(auth.router)
app.include_router(folder.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}