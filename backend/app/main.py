import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMService
from app.services.vector_store import VectorStore

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting PDF RAG service...")

    app.state.embedding_service = EmbeddingService(settings.EMBEDDING_MODEL)
    app.state.vector_store = VectorStore(settings.CHROMA_PATH)
    app.state.llm_service = LLMService(settings.CLAUDE_MODEL)

    chunks = app.state.vector_store.count()
    logger.info(f"Startup complete — {chunks} chunks loaded from pre-built index")

    yield

    logger.info("Shutting down")


app = FastAPI(
    title="PDF RAG API",
    description="RAG-powered document Q&A with Claude",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import chat, ingest  # noqa: E402 (after app init to avoid circular import)

app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(ingest.router, prefix="/api", tags=["documents"])


@app.get("/health")
async def health():
    chunks = app.state.vector_store.count() if hasattr(app.state, "vector_store") else 0
    return {"status": "healthy", "chunks_indexed": chunks}
