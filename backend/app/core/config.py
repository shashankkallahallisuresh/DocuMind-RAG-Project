from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    OPENROUTER_API_KEY: Optional[str] = None
    CLAUDE_MODEL: str = "anthropic/claude-sonnet-4-5"
    CHROMA_PATH: str = "./chroma_db"
    PDF_DIR: str = "./pdfs"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    MAX_HISTORY_TURNS: int = 10
    TOP_K_CHUNKS: int = 5
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
