# Functional Design Specification (FDS)
## DocuMind — AI Document Assistant

**Version:** 1.0
**Date:** March 2026
**Status:** Implemented

---

## 1. Purpose

This document describes the functional behaviour of DocuMind from a system perspective — what each feature does, how it behaves under different conditions, and what the system outputs for each input scenario.

---

## 2. Module: API Key Configuration

### 2.1 Description
Users must provide their own LLM provider API key before using DocuMind. The key is stored locally in the browser and never sent to the DocuMind server except as a pass-through to the LLM provider.

### 2.2 Functional Flows

**Flow 1: First Visit (No Key Stored)**
```
User opens app
  → System reads localStorage["documind-api-config"]
  → Value is null
  → ApiKeyModal is shown (cannot be dismissed — no X button)
  → User selects provider, enters API key, optionally specifies model
  → User clicks "Save Configuration"
  → Config saved to localStorage as JSON
  → Modal closes
  → Chat is now usable
```

**Flow 2: Returning Visit (Key Stored)**
```
User opens app
  → System reads localStorage["documind-api-config"]
  → Value found and parsed
  → apiConfig state populated
  → Modal NOT shown
  → Chat available immediately
```

**Flow 3: Update Key**
```
User clicks "API Key" in sidebar
  → ApiKeyModal opens (can be dismissed — X shown since key exists)
  → User modifies provider/key/model
  → Saves → localStorage updated → modal closes
```

**Flow 4: Invalid Key**
```
User sends message → backend returns 401 error
  → Error bar shows message + "Update key" link
  → User clicks "Update key" → ApiKeyModal opens
```

### 2.3 Supported Providers

| Provider | Key Format | Free Tier |
|----------|-----------|-----------|
| OpenRouter | `sk-or-v1-...` | Yes (free credits) |
| OpenAI | `sk-...` | No (paid) |
| Groq | `gsk_...` | Yes (free) |
| Together AI | varies | Yes (free credits) |

---

## 3. Module: PDF Document Indexing

### 3.1 Description
PDFs in the `backend/pdfs/` directory are automatically indexed into ChromaDB at build time. Indexing converts each document into overlapping text chunks and stores their vector embeddings.

### 3.2 Indexing Pipeline

```
For each PDF file:
  1. Parse with PyMuPDF → extract text per page
  2. Chunk text using sliding window (512 words, 50 overlap)
  3. Generate 384-dim embedding per chunk (all-MiniLM-L6-v2)
  4. Store in ChromaDB with metadata: {document, page, chunk_index}
```

### 3.3 Behaviour Conditions

| Condition | Behaviour |
|-----------|-----------|
| PDF already indexed | Skip (idempotent check via `document_exists()`) |
| PDF has no extractable text | Log warning, skip |
| PDF directory not found | Log warning, continue without docs |
| ChromaDB already populated | Load existing index, skip re-indexing |

---

## 4. Module: Chat

### 4.1 Description
The chat module accepts a user message, finds relevant document chunks, builds a context-augmented prompt, and streams the LLM response back to the browser via Server-Sent Events (SSE).

### 4.2 Request Schema

```json
{
  "session_id": "string (UUID)",
  "message": "string",
  "api_key": "string",
  "provider": "openrouter | openai | groq | together",
  "model": "string (optional)"
}
```

### 4.3 Response Stream (SSE)

Events are emitted in this order:
```
data: {"type": "sources", "data": [{document, page, text, score}, ...]}
data: {"type": "token",   "data": "Hello"}
data: {"type": "token",   "data": " world"}
...
data: {"type": "done"}
```

On error:
```
data: {"type": "error", "data": "Error message here"}
```

### 4.4 Functional Rules

| Rule | Detail |
|------|--------|
| Sources sent first | UI can render citations before answer begins |
| Top-K retrieval | Returns 5 most semantically similar chunks |
| Context window | All 5 chunks concatenated into system prompt |
| History cap | Last 10 turns (20 messages) included in prompt |
| Empty API key | Returns error event immediately, no LLM call made |
| Streaming cursor | `▋` appended to message while streaming |

### 4.5 System Prompt Structure

```
You are a helpful AI assistant that answers questions based on provided document context.

Instructions:
- Answer using ONLY the provided context
- Cite sources inline using [Document Name, p.X] format
- If answer not in context, say so clearly
- Use markdown formatting

Context from documents:
[Source: doc.pdf, Page 3]
<chunk text>

---

[Source: doc.pdf, Page 7]
<chunk text>
```

---

## 5. Module: Conversation Memory

### 5.1 Description
Each browser session has a UUID that identifies its conversation history. The history is stored in memory on the backend and passed to the LLM with each request.

### 5.2 Functional Rules

| Rule | Detail |
|------|--------|
| Session ID | Generated on page load, stored in `sessionStorage` |
| History storage | In-memory dict on backend (lost on restart) |
| History cap | Configurable `MAX_HISTORY_TURNS` (default 10 turns = 20 messages) |
| New Thread | Deletes session on backend, generates new UUID on frontend |
| Session clear | `DELETE /api/sessions/{id}` |

---

## 6. Module: Theme Toggle

### 6.1 Description
Users can switch between dark and light mode. The preference persists across sessions.

### 6.2 Functional Flow

```
User clicks theme toggle
  → Toggle isDark state
  → document.documentElement.classList.toggle("dark", next)
  → localStorage["rag-theme"] = "dark" | "light"
  → All components re-render using dark: Tailwind classes
```

**Default:** Dark mode on first visit.

---

## 7. Module: Source Citations

### 7.1 Description
Each assistant response is accompanied by the document chunks that were used to generate it. These are displayed as expandable cards above the answer.

### 7.2 Card Display

Each source card shows:
- Document name (PDF filename without extension)
- Page number
- Relevance score (cosine similarity as percentage)
- Expandable text preview (first 280 characters)

### 7.3 Functional Rules

| Rule | Detail |
|------|--------|
| Card count | Up to 5 per response |
| Expand/collapse | Click card to toggle text preview |
| One expanded at a time | Selecting a new card collapses the previous |
| Score display | `Math.round(score * 100)%` |

---

## 8. Error Handling Reference

| Error | Trigger | User Message |
|-------|---------|-------------|
| No API key | `api_key` is empty | "No API key provided. Please enter your API key via the key icon in the sidebar." |
| 401 Unauthorized | Provider rejects the key | Raw error from provider + "Update key" link |
| Connection failed | Backend unreachable | "Connection failed. Is the backend running?" |
| Backend 500 | Unhandled exception | "Internal server error" (logged server-side) |
| No documents | ChromaDB empty | Sources array is empty; LLM answers from general knowledge with caveat |
