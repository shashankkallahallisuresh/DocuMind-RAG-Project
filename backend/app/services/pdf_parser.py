import fitz  # PyMuPDF
import os
from typing import List, Dict


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def parse_pdf(file_path: str, chunk_size: int = 512, overlap: int = 50) -> List[Dict]:
    """Parse a PDF file into overlapping text chunks with page metadata."""
    doc = fitz.open(file_path)
    all_chunks = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")

        if not text.strip():
            continue

        page_chunks = chunk_text(text, chunk_size, overlap)
        for chunk in page_chunks:
            all_chunks.append({
                "text": chunk,
                "page": page_num + 1,
                "document": os.path.basename(file_path),
            })

    doc.close()
    return all_chunks
