import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMService
from app.services.pdf_parser import parse_pdf
from app.services.vector_store import VectorStore

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s: %(message)s")
logger = logging.getLogger(__name__)


async def auto_index_pdfs(app: FastAPI) -> None:
    """Index any PDFs in PDF_DIR that haven't been indexed yet."""
    try:
        settings = get_settings()
        pdf_dir = settings.PDF_DIR

        if not os.path.exists(pdf_dir):
            logger.warning(f"PDF directory '{pdf_dir}' not found — skipping auto-index")
            return

        pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
        logger.info(f"Found {len(pdf_files)} PDFs in {pdf_dir}: {pdf_files}")

        for pdf_file in pdf_files:
            try:
                if app.state.vector_store.document_exists(pdf_file):
                    logger.info(f"Already indexed: {pdf_file}")
                    continue

                file_path = os.path.join(pdf_dir, pdf_file)
                logger.info(f"Indexing: {pdf_file} ...")

                chunks = parse_pdf(file_path, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
                if not chunks:
                    logger.warning(f"No text extracted from {pdf_file}")
                    continue

                # Embed in batches of 32 to reduce peak memory usage
                batch_size = 32
                all_embeddings = []
                for i in range(0, len(chunks), batch_size):
                    batch = [c["text"] for c in chunks[i:i + batch_size]]
                    batch_embeddings = await app.state.embedding_service.aembed(batch)
                    all_embeddings.extend(batch_embeddings)

                app.state.vector_store.add_chunks(chunks, all_embeddings)
                logger.info(f"Indexed {len(chunks)} chunks from {pdf_file}")

            except Exception as e:
                logger.error(f"Failed to index {pdf_file}: {e}", exc_info=True)

    except Exception as e:
        logger.error(f"Auto-index task failed: {e}", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting PDF RAG service...")

    app.state.embedding_service = EmbeddingService(settings.EMBEDDING_MODEL)
    app.state.vector_store = VectorStore(settings.CHROMA_PATH)
    app.state.llm_service = LLMService(settings.CLAUDE_MODEL)

    # Index PDFs in the background so server starts accepting requests immediately
    asyncio.create_task(auto_index_pdfs(app))
    logger.info("Startup complete — ready to serve requests (indexing in background)")

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
