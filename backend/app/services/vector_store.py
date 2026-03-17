import logging
import uuid
from typing import Dict, List

import chromadb

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self, path: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(path=path)
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"VectorStore initialized at {path}, {self.count()} chunks loaded")

    def add_chunks(self, chunks: List[Dict], embeddings: List[List[float]]) -> None:
        ids = [str(uuid.uuid4()) for _ in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [{"page": c["page"], "document": c["document"]} for c in chunks]

        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        logger.info(f"Added {len(chunks)} chunks to vector store")

    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict]:
        total = self.count()
        if total == 0:
            return []

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, total),
        )

        sources = []
        for i in range(len(results["documents"][0])):
            sources.append({
                "text": results["documents"][0][i],
                "document": results["metadatas"][0][i]["document"],
                "page": results["metadatas"][0][i]["page"],
                "score": round(1 - results["distances"][0][i], 3),
            })

        return sources

    def document_exists(self, document_name: str) -> bool:
        results = self.collection.get(
            where={"document": {"$eq": document_name}},
            limit=1,
        )
        return len(results["ids"]) > 0

    def count(self) -> int:
        return self.collection.count()
