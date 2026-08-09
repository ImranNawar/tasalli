import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  languageHint?: "en" | "ur";
}

export default function ChatInput({ onSend, disabled, languageHint }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !disabled;

  /* textarea auto-resize */
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  /* Submit */
  const submitText = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitText();
    }
  };

  /* Reset textarea on send from outside (suggestion picks) */
  useEffect(() => {
    resize();
  }, [value]);

  return (
    <div className="pb-4">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm transition focus-within:ring-2 focus-within:ring-ring/40">
        <div className="flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Message Tasalli
          </label>
          <textarea
            id="chat-input"
            ref={ref}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              resize();
            }}
            onKeyDown={onKeyDown}
            rows={1}
            dir={languageHint === "ur" ? "rtl" : "auto"}
            placeholder="What's on your mind?"
            disabled={disabled}
            className="max-h-[140px] w-full resize-none bg-transparent px-2 py-2 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="button"
          onClick={submitText}
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-on-primary transition-all duration-150 ease-out hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-[18px] w-[18px]" />
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        No one here will judge you
      </p>
    </div>
  );
}
