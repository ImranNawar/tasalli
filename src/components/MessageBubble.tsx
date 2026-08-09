import TypingIndicator from "./TypingIndicator";
import { isUrduText } from "../lib/i18n";
import type { ChatMessage } from "../lib/chat";

interface Props {
  message: ChatMessage;
  streaming?: boolean;
}

export default function MessageBubble({ message, streaming }: Props) {
  const isUser = message.role === "user";
  const showDots = streaming && message.role === "assistant" && !message.content;
  const hasUrdu = isUrduText(message.content);

  return (
    <div className="msg-in flex items-end gap-2">
      {!isUser && <div className="min-w-[24px]" />}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
          isUser
            ? "bg-bubble-user text-bubble-user-foreground rounded-br-md"
            : "bg-bubble-ai text-bubble-ai-foreground rounded-bl-md border border-border"
        }`}
      >
        {showDots ? (
          <TypingIndicator />
        ) : (
          <p
            dir="auto"
            className={`whitespace-pre-wrap break-words ${
              hasUrdu ? "font-urdu leading-[2]" : ""
            }`}
          >
            {message.content}
            {streaming && message.role === "assistant" && (
              <span className="streaming-caret" aria-hidden="true">
                ▍
              </span>
            )}
          </p>
        )}
      </div>

      {isUser && <div className="min-w-[24px]" />}
    </div>
  );
}