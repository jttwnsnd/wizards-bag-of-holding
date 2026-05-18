from fastapi import FastAPI

app = FastAPI(title="Wizard's Bag of Holding")

@app.get("/health")
def health_check():
    return {"status": "ok"}