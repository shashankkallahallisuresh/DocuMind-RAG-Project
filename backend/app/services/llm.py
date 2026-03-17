import logging
from typing import AsyncGenerator, Dict, List

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions based on provided document context.

Instructions:
- Answer questions using ONLY the provided context from the documents
- Cite sources inline using [Document Name, p.X] format whenever you reference information
- If the answer cannot be found in the context, clearly say "I don't have information about that in the provided documents"
- Use markdown formatting (headers, bullets, code blocks) for clarity
- Be concise and accurate

Context from documents:
{context}"""


class LLMService:
    def __init__(self, api_key: str, model: str):
        self.client = AsyncOpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=api_key,
        )
        self.model = model
        logger.info(f"LLM service initialized via OpenRouter with model: {model}")

    async def stream_response(
        self,
        message: str,
        context: str,
        history: List[Dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        system = SYSTEM_PROMPT.format(context=context)

        messages = [{"role": "system", "content": system}]
        for turn in history:
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": message})

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=2048,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
