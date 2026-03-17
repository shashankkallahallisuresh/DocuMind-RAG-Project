import json
import logging
from typing import Dict, List

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory conversation store: session_id -> list of message dicts
sessions: Dict[str, List[Dict]] = {}


def format_context(sources: List[Dict]) -> str:
    parts = []
    for s in sources:
        parts.append(f"[Source: {s['document']}, Page {s['page']}]\n{s['text']}")
    return "\n\n---\n\n".join(parts)


@router.post("/chat")
async def chat(request: ChatRequest, req: Request):
    settings = get_settings()
    embedding_service = req.app.state.embedding_service
    vector_store = req.app.state.vector_store
    llm_service = req.app.state.llm_service

    # Retrieve and cap conversation history
    history = sessions.get(request.session_id, [])
    capped_history = history[-(settings.MAX_HISTORY_TURNS * 2):]

    # Semantic search (run in thread to avoid blocking event loop)
    query_embedding = await embedding_service.aembed_query(request.message)
    sources = vector_store.search(query_embedding, top_k=settings.TOP_K_CHUNKS)
    context = format_context(sources)

    api_key = request.api_key or get_settings().OPENROUTER_API_KEY
    if not api_key:
        async def no_key():
            yield f"data: {json.dumps({'type': 'error', 'data': 'No API key provided. Please configure your OpenRouter API key.'})}\n\n"
        return StreamingResponse(no_key(), media_type="text/event-stream")

    async def generate():
        try:
            # Send sources metadata first so UI can render citations immediately
            yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n"

            full_response = ""
            async for token in llm_service.stream_response(
                request.message, context, capped_history, api_key
            ):
                full_response += token
                yield f"data: {json.dumps({'type': 'token', 'data': token})}\n\n"

            # Persist turn to session history
            updated = sessions.get(request.session_id, [])
            updated.append({"role": "user", "content": request.message})
            updated.append({"role": "assistant", "content": full_response})
            sessions[request.session_id] = updated

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.exception("Error during chat stream")
            yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    sessions.pop(session_id, None)
    return {"success": True, "message": f"Session {session_id} cleared"}
