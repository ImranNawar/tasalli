import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, UserProfile } from "../lib/chat";
import { streamGeminiChat } from "../lib/chat";

const STORAGE_KEY = "tasalli.messages.v1";

/** Rough check: does this text look like it ended at a natural stopping point? */
function looksTruncated(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trimEnd();
  if (trimmed.length === 0) return false;
  // Ends with sentence-ending punctuation (including Urdu full stop U+06D4) or emoji — likely complete
  const goodEnding = /[.!?…)\u060C\u061F\u06D4\u002E\u003F\u0021]$/u.test(trimmed);
  // Or ends with a closing quote
  if (/[""''»]$/u.test(trimmed)) return false;
  // If it ends mid-word or mid-sentence with no punctuation, likely truncated
  return !goodEnding;
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (m): m is ChatMessage =>
          m &&
          typeof m === "object" &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      );
    }
  } catch {
    /* ignore corrupted data */
  }
  return [];
}

export function useConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncatedIndex, setTruncatedIndex] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  const streamingRef = useRef(false);
  const profileRef = useRef(userProfile);
  messagesRef.current = messages;
  profileRef.current = userProfile;

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      // Filter out empty assistant placeholders before saving
      const clean = messages.filter(
        (m) => m.role !== "assistant" || m.content.length > 0,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      /* quota exceeded or private browsing */
    }
  }, [messages]);

  /**
   * Core streaming function: takes a history, calls the Edge Function,
   * and appends assistant chunks to the message list.
   */
  const streamFrom = useCallback(async (history: ChatMessage[]) => {
    streamingRef.current = true;
    setIsStreaming(true);
    setError(null);
    setTruncatedIndex(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamGeminiChat(history, {
        signal: controller.signal,
        userProfile: profileRef.current,
        onChunk: (chunk) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = {
                role: "assistant",
                content: last.content + chunk,
              };
            } else {
              copy.push({ role: "assistant", content: chunk });
            }
            return copy;
          });
        },
        onError: (errorMsg) => {
          // Stream ended with an error from the server
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content) {
              // Mark as truncated if it didn't finish naturally
              if (looksTruncated(last.content)) {
                setTruncatedIndex(prev.length - 1);
              }
            }
            return prev;
          });
          setError(errorMsg || "Something went wrong on our end.");
        },
        onFinish: (reason) => {
          // Gemini finished with MAX_TOKENS or SAFETY — mark as truncated
          console.warn(`Gemini finish reason: ${reason}`);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content) {
              if (looksTruncated(last.content)) {
                setTruncatedIndex(prev.length - 1);
              }
            }
            return prev;
          });
        },
      });

      // Stream completed normally — check if the response looks truncated
      // (the onFinish handler above may have already flagged it)
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content && looksTruncated(last.content)) {
          setTruncatedIndex(prev.length - 1);
        }
        return prev;
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong — want me to try again?";
      setError(msg);
      // Check if we have partial content that should be marked truncated
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content) {
          if (looksTruncated(last.content)) {
            setTruncatedIndex(prev.length - 1);
          }
        } else if (last?.role === "assistant" && !last.content) {
          // Remove empty assistant bubble if stream errored before any content
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      streamingRef.current = false;
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  /** Send a new user message and start streaming an assistant reply. */
  const send = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text || streamingRef.current) return;
      const history: ChatMessage[] = [
        ...messagesRef.current,
        { role: "user", content: text },
      ];
      setMessages(history);
      void streamFrom(history);
    },
    [streamFrom],
  );

  /** Update the user profile used for response personalisation. */
  const updateUserProfile = useCallback((profile: UserProfile | null) => {
    setUserProfile(profile);
  }, []);

  // Keep the ref in sync
  useEffect(() => {
    profileRef.current = userProfile;
  }, [userProfile]);

  /** Retry the last exchange — removes the trailing assistant message and streams again. */
  const retry = useCallback(() => {
    if (streamingRef.current) return;
    setTruncatedIndex(null);
    setError(null);
    const cur = messagesRef.current;
    if (cur.length === 0) return;
    let history = cur;
    // Remove the last assistant message (whether truncated or complete)
    if (history[history.length - 1]?.role === "assistant")
      history = history.slice(0, -1);
    if (history.length === 0) return;
    setMessages(history);
    void streamFrom(history);
  }, [streamFrom]);

  /** Stop the current stream. */
  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Clear the entire conversation. */
  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  /** Dismiss the error banner. */
  const dismissError = useCallback(() => setError(null), []);

  /** Dismiss the truncated warning. */
  const clearTruncated = useCallback(() => setTruncatedIndex(null), []);

  return {
    messages,
    isStreaming,
    error,
    truncatedIndex,
    userProfile,
    send,
    retry,
    stop,
    clear,
    dismissError,
    clearTruncated,
    updateUserProfile,
  };
}