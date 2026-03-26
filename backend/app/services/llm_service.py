import httpx
import os

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MODEL_NAME = "mistral-small-latest"  # free tier friendly

async def generate_answer(question: str, context: str, chat_history: list = None) -> str:
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
You are an intelligent, helpful assistant analyzing a video transcript.

Context from the transcript:
{context}

Question:
{question}

Instructions:
1. Answer the question using ONLY the provided context and conversation history.
2. If the user asks what the video is about (e.g. "what is this video about?"), provide a clear summary of the provided context.
3. DO NOT use any Markdown formatting (no asterisks *, no bold, no italics, no bullet points). Provide your answer in plain, unformatted text.
4. If the provided context does not contain information to answer the question, say exactly: "I could not find relevant information in the transcript."

Answer:
"""
    
    messages = []
    if chat_history:
        for msg in chat_history:
            # Mistral only accepts strictly user or assistant roles
            role = "assistant" if msg.role == "assistant" else "user"
            messages.append({"role": role, "content": msg.content})
            
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": 0.2
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(MISTRAL_URL, headers=headers, json=payload)

    response.raise_for_status()
    data = response.json()

    return data["choices"][0]["message"]["content"]