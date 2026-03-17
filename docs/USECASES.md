# Detailed Use Case Document
## DocuMind — AI Document Assistant

**Version:** 1.0
**Date:** March 2026
**Perspective:** Product Manager

---

## 1. Actor Definitions

| Actor | Description |
|-------|-------------|
| **User** | Any person using DocuMind via a web browser |
| **System** | The DocuMind application (frontend + backend) |
| **LLM Provider** | External AI API (OpenRouter, OpenAI, Groq, Together AI) |

---

## 2. Use Case Index

| ID | Use Case | Priority |
|----|---------|----------|
| UC-01 | Configure API Key | P0 |
| UC-02 | Ask a Question | P0 |
| UC-03 | View Source Citations | P0 |
| UC-04 | Ask a Follow-Up Question | P1 |
| UC-05 | Start a New Conversation | P1 |
| UC-06 | Switch Theme | P2 |
| UC-07 | Change Provider or Model | P1 |
| UC-08 | Handle Invalid API Key | P1 |
| UC-09 | View Indexed Documents | P2 |

---

## 3. Detailed Use Cases

---

### UC-01: Configure API Key

**Goal:** User provides an LLM provider API key so DocuMind can generate responses.

**Primary Actor:** User

**Preconditions:**
- User has a valid API key from at least one supported provider
- User opens DocuMind for the first time (or has no saved config)

**Main Flow:**
1. System detects no API config in localStorage
2. System displays the API Key Configuration modal (cannot be dismissed)
3. User selects a provider from the grid: OpenRouter, OpenAI, Groq, or Together AI
4. System updates the API key placeholder and documentation link to match the selected provider
5. User enters their API key in the password field
6. *(Optional)* User enters a specific model name; if blank, system uses the provider default
7. User clicks "Save Configuration"
8. System validates that the key is non-empty
9. System stores the config as JSON in localStorage
10. Modal closes; chat interface becomes available

**Alternate Flow — Empty Key:**
- At step 7: User clicks Save with empty key field → button is disabled; nothing happens

**Postconditions:**
- `localStorage["documind-api-config"]` contains `{provider, apiKey, model}`
- User can send chat messages

---

### UC-02: Ask a Question

**Goal:** User asks a question and receives a streamed, cited answer from their documents.

**Primary Actor:** User

**Preconditions:**
- API config is saved (UC-01 completed)
- Backend is running with at least one document indexed

**Main Flow:**
1. User types a question in the input bar
2. User presses Enter or clicks the send button
3. System appends the user message to the chat as a heading
4. System appends an empty assistant message with a loading animation (three bouncing dots)
5. System embeds the user question (384-dim vector)
6. System searches ChromaDB for the top 5 most relevant chunks
7. System emits a `sources` SSE event; UI renders source cards above the answer area
8. System calls the LLM API with the context and conversation history
9. LLM streams tokens back; UI appends each token to the assistant message in real time
10. Streaming cursor `▋` moves with the latest token
11. System emits `done` event; cursor disappears; loading state clears

**Alternate Flow — No API Key:**
- At step 8: System detects empty key → emits error event → UI shows error bar with "Update key" link

**Alternate Flow — Backend Unreachable:**
- At step 5: Fetch throws network error → UI shows "Connection failed. Is the backend running?"

**Alternate Flow — No Relevant Documents:**
- At step 7: Sources array is empty → no source cards shown
- LLM responds acknowledging it cannot find the answer in the documents

**Postconditions:**
- Conversation history updated with this turn
- User sees a full markdown-formatted answer with citations

---

### UC-03: View Source Citations

**Goal:** User verifies which document pages were used to generate an answer.

**Primary Actor:** User

**Preconditions:**
- At least one answer has been received (UC-02 completed)
- At least one source chunk was found

**Main Flow:**
1. Source cards appear above the answer before streaming begins
2. Each card shows: document name, page number, relevance score
3. User clicks a source card
4. Card expands to reveal the first 280 characters of the source text
5. User reads the excerpt to verify the answer
6. User clicks the card again to collapse it

**Alternate Flow — Multiple Cards:**
- User clicks a second card while another is open → first card collapses, second expands

**Business Value:**
Source citations are the key differentiator from generic ChatGPT usage. They allow users to trust and verify AI-generated answers, which is critical in legal, research, and compliance contexts.

---

### UC-04: Ask a Follow-Up Question

**Goal:** User continues a conversation with context from prior turns.

**Primary Actor:** User

**Preconditions:**
- At least one Q&A turn has completed

**Main Flow:**
1. User types a follow-up question (e.g., "Can you explain that in simpler terms?")
2. System includes up to the last 10 turns of conversation history in the LLM prompt
3. LLM responds with awareness of prior context
4. New Q&A pair appended below the previous ones

**Example:**
```
Turn 1 — User: "What is Perplexity AI?"
Turn 1 — Assistant: "Perplexity AI is a research tool that..."

Turn 2 — User: "How does it compare to Elicit?"
Turn 2 — Assistant: "Compared to Perplexity, Elicit focuses more on..."
          ↑ LLM has context from Turn 1
```

**Postconditions:**
- Both turns visible in chat; history correctly maintained

---

### UC-05: Start a New Conversation

**Goal:** User clears the current conversation and begins fresh without reloading the page.

**Primary Actor:** User

**Preconditions:** At least one message has been sent

**Main Flow:**
1. User clicks "New Thread" in the sidebar
2. System calls `DELETE /api/sessions/{session_id}` to clear backend history
3. System generates a new UUID and stores it in `sessionStorage`
4. Chat window clears; empty state with suggested prompts is shown
5. Input placeholder resets to "Ask anything about your documents…"

**Postconditions:**
- New session ID active
- No conversation history
- Document index unchanged (PDFs still searchable)

---

### UC-06: Switch Theme

**Goal:** User toggles between dark mode and light mode.

**Primary Actor:** User

**Main Flow:**
1. User clicks the sun/moon icon at the bottom of the sidebar
2. System toggles `dark` class on `<html>` element
3. All components re-render with appropriate light/dark Tailwind styles
4. Preference saved to localStorage
5. Icon switches (sun → moon or moon → sun)

**Postconditions:**
- Theme persists on next visit

---

### UC-07: Change Provider or Model

**Goal:** User switches from one LLM provider to another or specifies a different model.

**Primary Actor:** User

**Preconditions:** API config already saved

**Main Flow:**
1. User clicks "API Key" in the sidebar
2. Modal opens, pre-populated with current provider/key/model
3. User selects a different provider (e.g., from OpenRouter to Groq)
4. Placeholder updates to Groq's key format (`gsk_...`) and docs link updates
5. User clears the old key, enters the Groq key
6. *(Optional)* User enters a specific Groq model name
7. User clicks "Save Configuration"
8. Config updated in localStorage
9. Next message uses the new provider and model

**Business Value:**
Prevents vendor lock-in. Users can switch providers based on cost, speed, or capability preferences without changing code.

---

### UC-08: Handle Invalid API Key

**Goal:** System gracefully informs the user when their API key is rejected.

**Primary Actor:** User (trigger); System (response)

**Main Flow:**
1. User sends a message with a saved API key
2. Backend passes the key to the LLM provider
3. Provider returns HTTP 401
4. Backend emits SSE error event with the provider's error message
5. Frontend displays error bar with the message
6. If error contains "401" or "auth", frontend also shows "Update key" button
7. User clicks "Update key" → API Key modal opens
8. User enters a valid key → saves → resends question

**Postconditions:**
- User has a working key configured
- Previous message can be resent

---

### UC-09: View Indexed Documents

**Goal:** User checks which PDF documents are available for querying.

**Primary Actor:** User

**Main Flow:**
1. On page load, system calls `GET /api/documents`
2. Backend returns list of indexed document filenames
3. Sidebar renders each document name under "Sources" section
4. User sees which documents are available before asking questions

**Business Value:**
Transparency — users know what knowledge base they're querying, preventing confusion when the AI can't answer questions outside the indexed documents.

---

## 4. Use Case Relationships

```
                    ┌─────────────┐
                    │  UC-01      │
                    │ Configure   │
                    │  API Key    │
                    └──────┬──────┘
                           │ enables
                    ┌──────▼──────┐
                    │  UC-02      │◄───── UC-09 (view docs first)
                    │  Ask a      │
                    │  Question   │
                    └──┬───────┬──┘
                       │       │
              ┌────────▼──┐ ┌──▼──────────┐
              │  UC-03    │ │   UC-04     │
              │  View     │ │  Follow-Up  │
              │ Citations │ │  Question   │
              └───────────┘ └─────────────┘

UC-07 (Change Provider) ──extends──► UC-01
UC-08 (Invalid Key)     ──extends──► UC-01
UC-05 (New Thread)      ──independent──
UC-06 (Switch Theme)    ──independent──
```
