from pydantic import BaseModel
from typing import List


class ChatRequest(BaseModel):
    session_id: str
    message: str


class Source(BaseModel):
    document: str
    page: int
    text: str
    score: float


class IngestResponse(BaseModel):
    success: bool
    documents_indexed: List[str]
    total_chunks: int
    message: str
