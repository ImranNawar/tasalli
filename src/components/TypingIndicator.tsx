export default function TypingIndicator() {
  return (
    <span
      className="inline-flex items-center gap-1.5 py-1"
      role="status"
      aria-label="Tasalli is typing"
    >
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
      <span
        className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60"
        style={{ animationDelay: "0.3s" }}
      />
    </span>
  );
}