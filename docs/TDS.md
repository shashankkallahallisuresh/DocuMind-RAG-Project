# Technical Design Specification (TDS)
## DocuMind — AI Document Assistant

**Version:** 1.0
**Date:** March 2026
**Status:** Implemented

---

## 1. System Overview

DocuMind is a two-service web application:
- **Backend:** Python FastAPI service handling PDF ingestion, vector search, and LLM streaming
- **Frontend:** Next.js 15 React application providing the chat UI

Both services are deployed on Railway using Nixpacks (no Docker required).

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│                                                         │
│   ┌─────────────┐         ┌──────────────────────────┐  │
│   │   Sidebar   │         │      ChatWindow          │  │
│   │  (docs list │         │  (MessageEntry +         │  │
│   │  API key    │         │   SourceCards)           │  │
│   │  theme)     │         │                          │  │
│   └─────────────┘         └──────────────────────────┘  │
│                                    │                    │
│                             ┌──────┴──────┐             │
│                             │   InputBar  │             │
│                             └──────┬──────┘             │
│                                    │                    │
│                             ┌──────┴──────┐             │
│                             │  useChat()  │ ←→ api.ts   │
│                             └─────────────┘             │
└───────────────────────────────────┬─────────────────────┘
                                    │ HTTPS / SSE
                          ┌─────────┴──────────┐
                          │   FastAPI Backend   │
                          │                     │
                          │  /api/chat   (POST) │
                          │  /api/documents (GET│
                          │  /health     (GET)  │
                          └──┬──────────────┬───┘
                             │              │
                    ┌────────┴───┐   ┌──────┴──────┐
                    │ ChromaDB   │   │  LLMService  │
                    │ (local)    │   │ (OpenRouter/ │
                    │            │   │  OpenAI/     │
                    │ 325 chunks │   │  Groq/       │
                    │ cosine sim │   │  Together)   │
                    └────────────┘   └──────────────┘
                         ↑
                ┌────────┴────────┐
                │ EmbeddingService│
                │ all-MiniLM-L6-v2│
                │ (384 dims)      │
                └─────────────────┘
```

---

## 3. Backend Design

### 3.1 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Web framework | FastAPI | 0.115+ |
| ASGI server | Uvicorn | 0.30+ |
| PDF parsing | PyMuPDF (fitz) | 1.24+ |
| Embeddings | sentence-transformers | 3.0+ |
| Embedding model | all-MiniLM-L6-v2 | — |
| Vector store | ChromaDB | 0.5+ |
| LLM client | openai SDK | 1.0+ |
| ML framework | PyTorch (CPU) | 2.2+ |

### 3.2 Service Initialization (Lifespan)

```
startup:
  1. Load EmbeddingService (all-MiniLM-L6-v2, 384-dim)
  2. Load VectorStore (ChromaDB at ./chroma_db)
  3. Initialize LLMService
  4. Log chunk count (pre-indexed at build time)
  → Server ready immediately (zero indexing at runtime)
```

PDFs are indexed **at Docker/Nixpacks build time** via `preindex.py`, not at runtime. This eliminates OOM crashes on memory-constrained deployments.

### 3.3 RAG Pipeline

```
User message
    │
    ▼
EmbeddingService.aembed_query(message)
    │  → 384-dim float32 vector
    ▼
VectorStore.search(query_vector, top_k=5)
    │  → cosine similarity over 325 chunks
    │  → returns [{document, page, text, score}]
    ▼
format_context(sources)
    │  → "[Source: doc.pdf, Page N]\n<text>\n---"
    ▼
LLMService.stream_response(message, context, history, api_key, provider, model)
    │  → AsyncOpenAI(base_url=<provider_url>, api_key=<user_key>)
    │  → chat.completions.create(..., stream=True)
    ▼
StreamingResponse (SSE)
    │  → data: {"type":"sources","data":[...]}
    │  → data: {"type":"token","data":"Hello"}  (×N)
    │  → data: {"type":"done"}
```

### 3.4 Multi-Provider LLM

All supported providers use the OpenAI-compatible chat completions API:

| Provider | Base URL | Default Model |
|----------|---------|--------------|
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4-5` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| Together AI | `https://api.together.xyz/v1` | `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` |

The `AsyncOpenAI` client is instantiated **per request** with the user-supplied key and provider base URL. No keys are stored server-side.

### 3.5 Chunking Strategy

- **Chunk size:** 512 words
- **Overlap:** 50 words
- **Method:** Sliding window over PyMuPDF page text
- **Metadata stored:** `{document, page, chunk_index}`

### 3.6 Conversation Memory

- Stored in-memory dict: `sessions: Dict[str, List[Dict]]`
- Capped at last `MAX_HISTORY_TURNS * 2` messages (default: 20 messages = 10 turns)
- No persistence across server restarts

### 3.7 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | SSE streaming chat endpoint |
| GET | `/api/documents` | List indexed documents |
| POST | `/api/ingest` | Manually re-index PDFs |
| DELETE | `/api/sessions/{id}` | Clear conversation session |
| GET | `/health` | Health check with chunk count |

---

## 4. Frontend Design

### 4.1 Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Markdown | react-markdown + remark-gfm |
| Icons | lucide-react |
| Theme | `darkMode: "class"` |

### 4.2 Component Tree

```
page.tsx
├── ApiKeyModal          ← provider/key/model config, localStorage
├── Sidebar
│   ├── Brand logo
│   ├── New Thread button
│   ├── Document list
│   ├── API Key button   ← opens ApiKeyModal
│   └── Theme toggle
└── main
    ├── ChatWindow
    │   ├── Empty state (suggested prompts)
    │   └── MessageEntry[]
    │       ├── User question (h2)
    │       ├── SourceCards  ← expandable, per citation
    │       └── Prose answer (ReactMarkdown)
    ├── Error bar
    └── InputBar          ← auto-grow textarea
```

### 4.3 SSE Parsing

The `sendChatMessage()` function in `api.ts` reads the streaming response using the Fetch ReadableStream API, splitting on `\n` and parsing `data: {...}` lines. Three event types drive UI state:

- `sources` → populate SourceCards before text starts
- `token` → append to assistant message content
- `done` → set `isStreaming: false`

### 4.4 State Management

All state is local React state — no global store (Redux/Zustand). Key state locations:

| State | Location | Persistence |
|-------|----------|------------|
| API config (key, provider, model) | `page.tsx` → localStorage | Browser localStorage |
| Theme | `page.tsx` → HTML class | localStorage |
| Session ID | `page.tsx` | sessionStorage |
| Messages | `useChat` hook | In-memory (React state) |
| Documents list | `page.tsx` | Fetched on mount |

---

## 5. Deployment

### 5.1 Infrastructure

| Service | Platform | Builder | URL |
|---------|---------|---------|-----|
| Backend | Railway | Nixpacks | `documind-rag-project-production.up.railway.app` |
| Frontend | Railway | Nixpacks | `documindai.up.railway.app` |

### 5.2 Build Process

**Backend (`nixpacks.toml`):**
1. Install: `pip install -r requirements.txt` (includes CPU PyTorch via `--extra-index-url`)
2. Build: `python preindex.py` (index all PDFs into ChromaDB)
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Frontend:**
1. Nixpacks auto-detects Next.js
2. Runs `npm install` + `npm run build`
3. Start: `npx next start -p $PORT`

### 5.3 Environment Variables (Backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_MODEL` | `anthropic/claude-sonnet-4-5` | Fallback model name |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence transformer model |
| `CHROMA_PATH` | `./chroma_db` | ChromaDB persistence path |
| `PDF_DIR` | `./pdfs` | PDF source directory |
| `TOP_K_CHUNKS` | `5` | Chunks retrieved per query |
| `MAX_HISTORY_TURNS` | `10` | Conversation turns retained |
| `CHUNK_SIZE` | `512` | Words per chunk |
| `CHUNK_OVERLAP` | `50` | Overlap words between chunks |

---

## 6. Performance Characteristics

| Metric | Value |
|--------|-------|
| Embedding model size | 80MB (all-MiniLM-L6-v2) |
| Runtime RAM (idle) | ~200MB |
| Runtime RAM (during query) | ~250MB peak |
| Chunks indexed | 325 (3 PDFs) |
| Query embedding time | ~50ms |
| Vector search time | ~10ms |
| First token latency | ~1–2s (network + LLM) |
