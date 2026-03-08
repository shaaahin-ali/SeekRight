import httpx
import os

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MODEL_NAME = "mistral-small-latest"  # free tier friendly

async def generate_answer(question: str, context: str) -> str:
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
You are a retrieval-based assistant.

Answer ONLY using the provided context.
If the answer is not present, say:
"I could not find relevant information in the transcript."

Context:
{context}

Question:
{question}

Answer:
"""

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(MISTRAL_URL, headers=headers, json=payload)

    response.raise_for_status()
    data = response.json()

    return data["choices"][0]["message"]["content"]