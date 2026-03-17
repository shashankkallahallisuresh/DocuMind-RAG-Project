# DocuMind - AI Document Assistant

> Chat with your PDF documents. Get accurate, cited answers powered by your choice of AI provider.

**Live App:** https://documindai.up.railway.app

---

## What is DocuMind?

DocuMind is a Retrieval Augmented Generation (RAG) chatbot that lets you have natural language conversations with a collection of PDF documents. Ask questions in plain English — DocuMind finds the most relevant passages and generates a clear answer with source citations (document name + page number).

### Key Features
- **Multi-turn chat** with conversation memory
- **Source citations** — every answer shows which document pages it came from
- **Multi-provider** — bring your own API key from OpenRouter, OpenAI, Groq, or Together AI
- **Streaming responses** — answers appear token by token, instantly
- **Dark / Light mode** toggle
- **Mobile responsive**

---

## Supported AI Providers

| Provider | Free Tier | Key Format | Get Key |
|----------|-----------|-----------|---------|
| OpenRouter | ✅ Yes | `sk-or-v1-...` | https://openrouter.ai/keys |
| OpenAI | ❌ Paid | `sk-...` | https://platform.openai.com/api-keys |
| Groq | ✅ Yes | `gsk_...` | https://console.groq.com/keys |
| Together AI | ✅ Yes | varies | https://api.together.ai/settings/api-keys |

---

## Demo:

<img width="1440" height="860" alt="Screenshot 2026-03-17 at 5 07 29 PM" src="https://github.com/user-attachments/assets/e2361f34-0511-4b78-9c03-dc1628650877" />

<img width="1440" height="858" alt="Screenshot 2026-03-17 at 5 07 43 PM" src="https://github.com/user-attachments/assets/c3b52dd7-ee67-4f38-970e-210c809d8066" />

<img width="1440" height="858" alt="Screenshot 2026-03-17 at 5 10 28 PM" src="https://github.com/user-attachments/assets/ce86df43-6142-4257-b720-253c869a0981" />

<img width="1440" height="857" alt="Screenshot 2026-03-17 at 5 12 42 PM" src="https://github.com/user-attachments/assets/7dab16f8-e331-4b29-ae23-8411f1d81f54" />



## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone the repo
```bash
git clone https://github.com/shashankkallahallisuresh/DocuMind-RAG-Project.git
cd DocuMind-RAG-Project
```

### 2. Add your PDFs
```bash
cp your-documents/*.pdf backend/pdfs/
```

### 3. Start the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
python preindex.py          # Index PDFs once
uvicorn app.main:app --reload --port 8000
```

### 4. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000, enter your API key when prompted, and start chatting.

---

## Project Structure

```
DocuMind-RAG-Project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat.py          # SSE streaming chat endpoint
│   │   │   └── ingest.py        # Manual re-index endpoint
│   │   ├── core/
│   │   │   └── config.py        # Settings (pydantic-settings)
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── embeddings.py    # SentenceTransformer wrapper
│   │   │   ├── llm.py           # Multi-provider OpenAI-compatible LLM
│   │   │   ├── pdf_parser.py    # PyMuPDF chunking
│   │   │   └── vector_store.py  # ChromaDB wrapper
│   │   └── main.py              # FastAPI app + lifespan
│   ├── pdfs/                    # Place your PDFs here
│   ├── chroma_db/               # Vector store (auto-created)
│   ├── preindex.py              # Build-time PDF indexing script
│   ├── nixpacks.toml            # Nixpacks build config (Railway)
│   ├── railway.toml             # Railway deploy config
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Main page (state orchestration)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ApiKeyModal.tsx  # Provider/key/model config modal
│   │   │   ├── ChatWindow.tsx   # Message list
│   │   │   ├── InputBar.tsx     # Auto-growing textarea
│   │   │   ├── MessageEntry.tsx # Q&A pair with markdown
│   │   │   ├── SourceCards.tsx  # Expandable citation cards
│   │   │   └── Sidebar.tsx      # Nav + docs + theme toggle
│   │   ├── hooks/
│   │   │   └── useChat.ts       # Chat state + SSE handler
│   │   └── lib/
│   │       └── api.ts           # Fetch + SSE parser
│   ├── railway.toml
│   └── package.json
│
└── docs/
    ├── PRD.md                   # Product Requirements Document
    ├── TDS.md                   # Technical Design Specification
    ├── FDS.md                   # Functional Design Specification
    └── USECASES.md              # Detailed Use Cases
```

---

## Architecture

```
Browser ──HTTPS──► Next.js Frontend ──HTTPS/SSE──► FastAPI Backend
                                                         │
                                              ┌──────────┴──────────┐
                                              │                     │
                                         ChromaDB              LLM Provider
                                       (325 chunks,          (OpenRouter /
                                        cosine sim)           OpenAI /
                                              │               Groq /
                                   all-MiniLM-L6-v2           Together)
                                    (384-dim embeds)
```

**RAG Pipeline:**
1. User message → embed → 384-dim vector
2. Cosine similarity search → top 5 chunks from ChromaDB
3. Chunks injected into LLM system prompt
4. LLM streams response → SSE to browser
5. Sources displayed before answer begins

---

## Deployment (Railway)

Both services deploy automatically from the `main` branch.

### Backend
Uses `nixpacks.toml` for custom build phases:
- Installs CPU-only PyTorch (saves ~1.5GB vs CUDA build)
- Runs `preindex.py` at build time (PDFs indexed once, not at runtime)
- Starts with Uvicorn

### Frontend
Nixpacks auto-detects Next.js:
- `npm install` + `npm run build`
- `npx next start -p $PORT`

### Manual Redeploy
```bash
# Trigger via Railway CLI (if installed)
railway up

# Or push to main branch — Railway auto-deploys
git push origin main
```

---

## Configuration

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence transformer model |
| `CLAUDE_MODEL` | `anthropic/claude-sonnet-4-5` | Default LLM model |
| `CHROMA_PATH` | `./chroma_db` | ChromaDB path |
| `PDF_DIR` | `./pdfs` | PDF source directory |
| `TOP_K_CHUNKS` | `5` | Retrieved chunks per query |
| `MAX_HISTORY_TURNS` | `10` | Conversation turns to retain |
| `CHUNK_SIZE` | `512` | Words per chunk |
| `CHUNK_OVERLAP` | `50` | Overlap words between chunks |

### Frontend Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements, goals, features, success metrics |
| [TDS](docs/TDS.md) | Technical architecture, APIs, data flow, deployment |
| [FDS](docs/FDS.md) | Functional specification, module behaviour, error handling |
| [Use Cases](docs/USECASES.md) | Detailed use cases from a product manager perspective |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector DB | ChromaDB (local, cosine similarity) |
| PDF Parsing | PyMuPDF (fitz) |
| LLM | OpenAI-compatible (multi-provider) |
| Deployment | Railway (Nixpacks) |

---

