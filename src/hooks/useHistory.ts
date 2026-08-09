import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ChatMessage } from "../lib/chat";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface HistoryState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
}

/**
 * Hook for cross-session conversation history persisted in Supabase.
 * Only active when a user is signed in.
 */
export function useHistory(userId: string | null) {
  const [state, setState] = useState<HistoryState>({
    conversations: [],
    activeConversationId: null,
    loading: false,
  });

  // Load conversation list when user changes
  useEffect(() => {
    if (!userId) {
      setState({ conversations: [], activeConversationId: null, loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setState({
            conversations: data as Conversation[],
            activeConversationId: null,
            loading: false,
          });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      });
  }, [userId]);

  /** Create a new conversation and return its ID. */
  const createConversation = useCallback(
    async (title?: string): Promise<string | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: title ?? "New conversation" })
        .select("id")
        .single();

      if (error || !data) {
        console.error("Failed to create conversation:", error);
        return null;
      }

      const newId = data.id;
      setState((s) => ({
        ...s,
        conversations: [
          { id: newId, title: title ?? "New conversation", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          ...s.conversations,
        ],
        activeConversationId: newId,
      }));
      return newId;
    },
    [userId]
  );

  /** Load messages for a specific conversation. */
  const loadMessages = useCallback(
    async (
      conversationId: string
    ): Promise<ChatMessage[] | null> => {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load messages:", error);
        return null;
      }
      return (data ?? []) as ChatMessage[];
    },
    []
  );

  /** Save a batch of messages to the current conversation. */
  const saveMessages = useCallback(
    async (
      conversationId: string,
      messages: ChatMessage[]
    ): Promise<void> => {
      if (!userId) return;

      // Upsert messages — we insert all and rely on the conversation_id
      const rows = messages.map((m, i) => ({
        conversation_id: conversationId,
        role: m.role,
        content: m.content,
        created_at: new Date(Date.now() + i).toISOString(),
      }));

      const { error } = await supabase.from("messages").insert(rows);
      if (error) {
        console.error("Failed to save messages:", error);
      }
    },
    [userId]
  );

  /** Switch the active conversation. */
  const switchConversation = useCallback((id: string | null) => {
    setState((s) => ({ ...s, activeConversationId: id }));
  }, []);

  /** Delete a conversation. */
  const deleteConversation = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Failed to delete conversation:", error);
        return;
      }
      setState((s) => ({
        ...s,
        conversations: s.conversations.filter((c) => c.id !== id),
        activeConversationId:
          s.activeConversationId === id ? null : s.activeConversationId,
      }));
    },
    []
  );

  /** Set / update the title for the active conversation (uses first user message as hint). */
  const updateTitle = useCallback(
    async (id: string, title: string) => {
      const { error } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        console.error("Failed to update title:", error);
        return;
      }
      setState((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c
        ),
      }));
    },
    []
  );

  return {
    ...state,
    createConversation,
    loadMessages,
    saveMessages,
    switchConversation,
    deleteConversation,
    updateTitle,
  };
}