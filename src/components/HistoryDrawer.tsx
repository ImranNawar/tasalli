import { Plus, MessageSquare, Trash2, X } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Slide-over panel listing saved conversations. Only shown for
 * signed-in users; anonymous users get a gentle nudge instead.
 */
export default function HistoryDrawer({
  open,
  onClose,
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col border-e border-border bg-card shadow-xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        dir="ltr"
        role="dialog"
        aria-modal="true"
        aria-label="Conversation history"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-heading text-base text-foreground">History</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onNew}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary transition duration-150 ease-out hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition duration-150 ease-out hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <MessageSquare
                className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-muted-foreground">
                No saved conversations yet. Start a chat and it will be saved
                here for next time.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(c.id);
                      }
                    }}
                    className={`group flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-start transition duration-150 ease-out ${
                      c.id === activeId
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <MessageSquare
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground/90">
                        {c.title || "Untitled conversation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.updated_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete conversation ${c.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground/60 opacity-0 transition duration-150 ease-out hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Conversations are private to your account. Nothing is shared.
          </p>
        </div>
      </aside>
    </>
  );
}
