import httpx
from app.core.config import settings

async def generate_embedding(text: str) -> list[float]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.OLLAMA_URL}/api/embeddings",
            json={
                "model": "nomic-embed-text",
                "prompt": text
            },
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()["embedding"]

def build_file_text(filename: str, mime_type: str) -> str:
    return f"{filename} {mime_type}"