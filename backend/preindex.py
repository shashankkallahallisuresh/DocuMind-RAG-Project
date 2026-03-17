"""
Build-time script: indexes all PDFs into ChromaDB so the container
needs zero embedding work at runtime.
"""
import os
import sys

PDF_DIR = "./pdfs"
CHROMA_PATH = "./chroma_db"
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.environ.get("CHUNK_OVERLAP", "50"))

from app.services.pdf_parser import parse_pdf
from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStore

print(f"Loading embedding model: {EMBEDDING_MODEL}")
embedding_service = EmbeddingService(EMBEDDING_MODEL)
vector_store = VectorStore(CHROMA_PATH)

if not os.path.exists(PDF_DIR):
    print(f"No PDF directory found at {PDF_DIR}, skipping.")
    sys.exit(0)

pdf_files = [f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf")]
print(f"Found {len(pdf_files)} PDFs: {pdf_files}")

for pdf_file in pdf_files:
    if vector_store.document_exists(pdf_file):
        print(f"Already indexed: {pdf_file}")
        continue

    file_path = os.path.join(PDF_DIR, pdf_file)
    print(f"Indexing: {pdf_file} ...")

    chunks = parse_pdf(file_path, CHUNK_SIZE, CHUNK_OVERLAP)
    if not chunks:
        print(f"No text extracted from {pdf_file}, skipping.")
        continue

    # Batch to keep memory low
    all_embeddings = []
    for i in range(0, len(chunks), 32):
        batch = [c["text"] for c in chunks[i:i + 32]]
        all_embeddings.extend(embedding_service.embed(batch))

    vector_store.add_chunks(chunks, all_embeddings)
    print(f"Indexed {len(chunks)} chunks from {pdf_file}")

total = vector_store.count()
print(f"Pre-indexing complete. Total chunks in DB: {total}")
