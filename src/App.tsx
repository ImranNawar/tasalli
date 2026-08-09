import { useCallback, useEffect, useRef, useState } from "react";
import { Sprout } from "lucide-react";
import Header from "./components/Header";
import { useConversation } from "./hooks/useConversation";
import MessageBubble from "./components/MessageBubble";
import TypingIndicator from "./components/TypingIndicator";
import ChatInput from "./components/ChatInput";
import AuthModal from "./components/AuthModal";
import HistoryDrawer from "./components/HistoryDrawer";
import { useAuth } from "./hooks/useAuth";
import { useHistory } from "./hooks/useHistory";
import { type Language } from "./lib/i18n";
import type { ChatMessage, UserProfile } from "./lib/chat";

type Theme = "light" | "dark";

const THEME_KEY = "tasalli.theme";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  )
    return "dark";
  return "light";
}

const SUGGESTIONS = [
  "I've been feeling really low lately.",
  "I can't stop worrying about tomorrow.",
  "I had a rough day and need to talk.",
];

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 pt-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sprout className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="font-heading text-2xl text-foreground">
          What&rsquo;s on your mind?
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          Tasalli is here to listen - no judgment, no rush. Say it however it
          comes to you.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/90 transition duration-150 ease-out hover:border-primary/30 hover:bg-primary/5 hover:text-foreground active:scale-[0.98]"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [language, setLanguage] = useState<Language>("auto");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  /* Conversation */
  const {
    messages,
    isStreaming,
    error,
    truncatedIndex,
    send,
    retry,
    stop,
    clear: clearMessages,
    dismissError,
    clearTruncated,
    updateUserProfile,
  } = useConversation();

  /* Auth */
  const { user, profile, loading: _authLoading, signIn, signUp, signOut } =
    useAuth();

  /* Sync auth profile to conversation personalisation */
  useEffect(() => {
    if (profile) {
      const convProfile: UserProfile = {
        age_group: profile.age_group ?? undefined,
        gender: profile.gender ?? undefined,
        context_info: profile.context_info ?? undefined,
        onboarding_complete: profile.onboarding_complete ?? undefined,
        display_name: profile.display_name,
      };
      updateUserProfile(convProfile);
    } else {
      updateUserProfile(null);
    }
  }, [profile, updateUserProfile]);

  /* History */
  const {
    conversations,
    activeConversationId,
    loading: historyLoading,
    createConversation,
    loadMessages,
    saveMessages,
    switchConversation,
    deleteConversation,
    updateTitle,
  } = useHistory(user?.id ?? null);

  /* Save conversation to Supabase */
  const lastSavedRef = useRef<string>("");
  useEffect(() => {
    if (!user || !activeConversationId) return;
    const key = `${activeConversationId}:${messages.length}`;
    if (key === lastSavedRef.current) return;
    lastSavedRef.current = key;

    const timer = setTimeout(async () => {
      const complete: ChatMessage[] = messages
        .filter((m) => m.role !== "assistant" || m.content.length > 0)
        .map((m) => ({ role: m.role, content: m.content }));
      if (complete.length === 0) return;

      await saveMessages(activeConversationId, complete);

      const firstUser = complete.find((m) => m.role === "user");
      if (firstUser && conversations.length > 0) {
        const conv = conversations.find((c) => c.id === activeConversationId);
        if (conv && conv.title === "New conversation") {
          const title = firstUser.content.slice(0, 50);
          await updateTitle(
            activeConversationId,
            title + (firstUser.content.length > 50 ? "…" : ""),
          );
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    messages,
    user,
    activeConversationId,
    saveMessages,
    updateTitle,
    conversations,
  ]);

  /* Send handlers */

  const handleSend = useCallback(
    (text: string) => {
      if (user && !activeConversationId) {
        const firstWords = text.slice(0, 50);
        createConversation(firstWords + (text.length > 50 ? "…" : ""));
      }
      send(text);
    },
    [user, activeConversationId, createConversation, send],
  );

  /* Theme / scroll */

  const endRef = useRef<HTMLDivElement>(null);
  const streamRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = language === "ur" ? "ur" : "en";
  }, [language]);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages, isStreaming]);

  const toggleTheme = () =>
    setTheme((p) => (p === "light" ? "dark" : "light"));

  /* History handlers */

  const handleSelectConversation = useCallback(
    async (id: string) => {
      switchConversation(id);
      const loaded = await loadMessages(id);
      if (loaded) {
        try {
          localStorage.setItem("tasalli.messages.v1", JSON.stringify(loaded));
        } catch {
          /* ignore */
        }
        window.location.reload();
      }
    },
    [switchConversation, loadMessages],
  );

  const handleNewConversation = useCallback(async () => {
    if (!user) return;
    const id = await createConversation();
    if (id) {
      try {
        localStorage.removeItem("tasalli.messages.v1");
      } catch {
        /* ignore */
      }
      switchConversation(id);
      window.location.reload();
    }
  }, [user, createConversation, switchConversation]);

  const handleClear = useCallback(() => {
    clearMessages();
    if (user && activeConversationId) {
      handleNewConversation();
    }
  }, [clearMessages, user, activeConversationId, handleNewConversation]);

  /* Render */

  const lastMessage = messages[messages.length - 1];
  const shouldShowStandaloneIndicator =
    isStreaming && (!lastMessage || lastMessage.role !== "assistant");

  const lastAssistantIdx = (() => {
    if (!isStreaming) return -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div className="app-bg flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-4">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onClear={handleClear}
          hasMessages={messages.length > 0}
          language={language}
          onLanguageChange={setLanguage}
          isSignedIn={!!user}
          displayName={profile?.display_name ?? user?.email ?? null}
          onSignInClick={() => setAuthModalOpen(true)}
          onSignOut={signOut}
          onOpenHistory={() => setHistoryOpen(true)}
        />

        {/* Message list */}
        <main
          ref={streamRegionRef}
          className="scroll-thin flex-1 overflow-y-auto pb-4"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.length === 0 && !isStreaming ? (
            <div className="flex h-full flex-col">
              <EmptyState onPick={handleSend} />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className="space-y-1">
                  <MessageBubble
                    message={m}
                    streaming={i === lastAssistantIdx}
                  />
                  {/* Truncation warning — message looks incomplete */}
                  {!isStreaming && truncatedIndex === i && (
                    <div className="flex items-center gap-2 pl-14">
                      <span className="text-xs text-muted-foreground/70">
                        This reply seems incomplete
                      </span>
                      <button
                        type="button"
                        onClick={() => { retry(); clearTruncated(); }}
                        className="cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {shouldShowStandaloneIndicator && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-border bg-bubble-ai px-4 py-2.5 shadow-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={endRef} aria-hidden="true" />
            </div>
          )}
        </main>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            <span>{error}</span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={retry}
                className="cursor-pointer rounded-lg px-2.5 py-1 font-semibold text-destructive transition hover:bg-destructive/10"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={dismissError}
                className="cursor-pointer rounded-lg px-2 py-1 text-destructive/60 transition hover:text-destructive"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stop streaming button */}
        {isStreaming && (
          <div className="mb-2 flex justify-center">
            <button
              type="button"
              onClick={stop}
              className="cursor-pointer rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition duration-150 ease-out hover:bg-muted hover:text-foreground"
            >
              Stop generating
            </button>
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          disabled={isStreaming}
        />

        {/* Safety disclaimer */}
        <footer className="pb-3 text-center text-[11px] leading-relaxed text-muted-foreground/70">
          Tasalli is a supportive AI companion, not a licensed therapist. If
          you&rsquo;re in crisis, please reach out to local emergency services
          or a crisis helpline.
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />

      {/* History Drawer */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={conversations}
        activeId={activeConversationId}
        loading={historyLoading}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={deleteConversation}
      />
    </div>
  );
}