from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    session_id: str
    message: str
    api_key: Optional[str] = None


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
