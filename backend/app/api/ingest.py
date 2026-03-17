import logging
import os

from fastapi import APIRouter, Request

from app.core.config import get_settings
from app.models.schemas import IngestResponse
from app.services.pdf_parser import parse_pdf

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest_documents(req: Request):
    """Manually trigger re-indexing of all PDFs in the PDF directory."""
    settings = get_settings()
    embedding_service = req.app.state.embedding_service
    vector_store = req.app.state.vector_store

    pdf_dir = settings.PDF_DIR
    if not os.path.exists(pdf_dir):
        return IngestResponse(
            success=False,
            documents_indexed=[],
            total_chunks=0,
            message=f"PDF directory '{pdf_dir}' not found",
        )

    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
    indexed_docs = []
    total_chunks = 0

    for pdf_file in pdf_files:
        if vector_store.document_exists(pdf_file):
            logger.info(f"Already indexed, skipping: {pdf_file}")
            continue

        file_path = os.path.join(pdf_dir, pdf_file)
        logger.info(f"Indexing: {pdf_file}")

        chunks = parse_pdf(file_path, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
        if not chunks:
            continue

        texts = [c["text"] for c in chunks]
        embeddings = await embedding_service.aembed(texts)
        vector_store.add_chunks(chunks, embeddings)

        indexed_docs.append(pdf_file)
        total_chunks += len(chunks)

    return IngestResponse(
        success=True,
        documents_indexed=indexed_docs,
        total_chunks=total_chunks,
        message=f"Indexed {len(indexed_docs)} new documents with {total_chunks} total chunks",
    )


@router.get("/documents")
async def list_documents(req: Request):
    """List all PDFs and current index stats."""
    settings = get_settings()
    vector_store = req.app.state.vector_store

    pdf_dir = settings.PDF_DIR
    pdf_files = []
    if os.path.exists(pdf_dir):
        pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]

    return {
        "documents": pdf_files,
        "total_chunks": vector_store.count(),
    }
