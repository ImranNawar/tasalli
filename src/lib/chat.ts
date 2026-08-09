import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface UserProfile {
  age_group?: string;
  gender?: string;
  context_info?: string;
  onboarding_complete?: boolean;
  display_name?: string | null;
}

export interface StreamOptions {
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onError?: (msg: string) => void;
  /** Fired when the stream ends with a Gemini-level finish reason (MAX_TOKENS, SAFETY, etc.) */
  onFinish?: (reason: string) => void;
  /** Optional user profile for personalised responses */
  userProfile?: UserProfile | null;
}

/**
 * Calls the `gemini-chat` Edge Function and consumes its SSE stream,
 * invoking `onChunk` with each incremental text fragment.
 */
export async function streamGeminiChat(
  messages: ChatMessage[],
  { signal, onChunk, onError, onFinish, userProfile }: StreamOptions
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/gemini-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ messages, session_context: {}, user_profile: userProfile ?? null }),
    signal,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") detail = body.error;
    } catch {
      // fall back to the generic message
    }
    throw new Error(detail);
  }

  if (!res.body) throw new Error("No response body received.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      let eventType = "data"; // default event type
      let dataLines: string[] = [];

      for (const line of event.split("\n")) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      for (const payload of dataLines) {
        if (payload === "[DONE]") return;

        if (eventType === "finish") {
          // Gemini-level finish reason — not an error, but useful info
          try {
            const json = JSON.parse(payload) as { reason?: string };
            if (json.reason && json.reason !== "STOP") {
              console.warn(`Gemini stream finished with reason: ${json.reason}`);
              onFinish?.(json.reason);
            }
          } catch {
            // ignore
          }
          continue;
        }

        if (eventType === "error") {
          try {
            const json = JSON.parse(payload) as { error?: string };
            onError?.(json.error ?? "Something went wrong on our end.");
          } catch {
            onError?.("Something went wrong on our end.");
          }
          return;
        }

        try {
          const json = JSON.parse(payload) as { text?: string };
          if (typeof json.text === "string") onChunk(json.text);
        } catch {
          // Ignore malformed frames
        }
      }
    }
  }

  // If we finished without [DONE] and without an error event, it's still a normal end
  // but log it for diagnostics
  console.debug("Gemini stream ended without explicit [DONE] marker");
}