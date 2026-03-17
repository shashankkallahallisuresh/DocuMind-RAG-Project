const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Source {
  document: string;
  page: number;
  text: string;
  score: number;
}

export type SSEEvent =
  | { type: "sources"; data: Source[] }
  | { type: "token"; data: string }
  | { type: "done" }
  | { type: "error"; data: string };

export async function sendChatMessage(
  sessionId: string,
  message: string,
  onToken: (token: string) => void,
  onSources: (sources: Source[]) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  apiKey?: string
): Promise<void> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message, api_key: apiKey }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");

    // Keep last (potentially incomplete) line in buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const event = JSON.parse(jsonStr) as SSEEvent;
        if (event.type === "sources") onSources(event.data);
        else if (event.type === "token") onToken(event.data);
        else if (event.type === "done") onDone();
        else if (event.type === "error") onError(event.data);
      } catch {
        // Ignore malformed JSON chunks
      }
    }
  }
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/api/sessions/${sessionId}`, { method: "DELETE" });
}

export async function getDocuments(): Promise<{
  documents: string[];
  total_chunks: number;
}> {
  const res = await fetch(`${API_URL}/api/documents`);
  return res.json();
}
