import logging
from typing import AsyncGenerator, Dict, List

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

PROVIDERS = {
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "default_model": "anthropic/claude-sonnet-4-5",
    },
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "default_model": "llama-3.3-70b-versatile",
    },
    "together": {
        "base_url": "https://api.together.xyz/v1",
        "default_model": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    },
}

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
    def __init__(self, default_model: str):
        self.default_model = default_model
        logger.info("LLM service initialized (multi-provider)")

    async def stream_response(
        self,
        message: str,
        context: str,
        history: List[Dict[str, str]],
        api_key: str,
        provider: str = "openrouter",
        model: str = None,
    ) -> AsyncGenerator[str, None]:
        provider_cfg = PROVIDERS.get(provider, PROVIDERS["openrouter"])
        resolved_model = model or provider_cfg["default_model"]

        client = AsyncOpenAI(
            base_url=provider_cfg["base_url"],
            api_key=api_key,
        )

        system = SYSTEM_PROMPT.format(context=context)
        messages = [{"role": "system", "content": system}]
        for turn in history:
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": message})

        logger.info(f"Streaming via {provider} / {resolved_model}")

        stream = await client.chat.completions.create(
            model=resolved_model,
            messages=messages,
            max_tokens=2048,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
