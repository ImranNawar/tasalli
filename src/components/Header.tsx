import { useState } from "react";
import {
  Moon,
  Sun,
  Trash2,
  Sprout,
  History,
  LogIn,
  LogOut,
  Languages,
} from "lucide-react";
import type { Language } from "../lib/i18n";

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onClear: () => void;
  hasMessages: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isSignedIn: boolean;
  displayName: string | null;
  onSignInClick: () => void;
  onSignOut: () => void;
  onOpenHistory: () => void;
}

const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ur", label: "اردو" },
  { value: "auto", label: "AUTO" },
];

export default function Header({
  theme,
  onToggleTheme,
  onClear,
  hasMessages,
  language,
  onLanguageChange,
  isSignedIn,
  displayName,
  onSignInClick,
  onSignOut,
  onOpenHistory,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClear = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setConfirming(false);
    onClear();
  };

  const initials =
    displayName
      ?.split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const currentLangLabel =
    LANG_OPTIONS.find((o) => o.value === language)?.label ?? "EN";

  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <Sprout className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="font-heading text-lg tracking-tight text-foreground">
          Tasalli
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        {isSignedIn && (
          <button
            type="button"
            onClick={onOpenHistory}
            aria-label="Open conversation history"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition duration-150 ease-out hover:bg-muted hover:text-foreground"
          >
            <History className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        )}

        {/* Language toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            aria-label={`Language: ${currentLangLabel}`}
            aria-expanded={langOpen}
            className="flex h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition duration-150 ease-out hover:bg-muted hover:text-foreground"
          >
            <Languages className="h-[16px] w-[16px]" aria-hidden="true" />
            <span className="hidden sm:inline">{currentLangLabel}</span>
          </button>
          {langOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setLangOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute end-0 z-40 mt-1 w-32 rounded-xl border border-border bg-card p-1 shadow-lg">
                {LANG_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onLanguageChange(o.value);
                      setLangOpen(false);
                    }}
                    className={`block w-full cursor-pointer rounded-lg px-3 py-1.5 text-start text-sm transition duration-150 ease-out hover:bg-muted ${
                      language === o.value
                        ? "font-semibold text-primary"
                        : "text-foreground/80"
                    }`}
                  >
                    {o.label}
                    {o.value === "auto" && (
                      <span className="ms-1 text-xs text-muted-foreground">
                        auto-detect
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {hasMessages && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={confirming ? "Confirm clear" : "Clear conversation"}
            className={`flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium transition duration-150 ease-out ${
              confirming
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {confirming ? (
              "Sure?"
            ) : (
              <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition duration-150 ease-out hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
          ) : (
            <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
          )}
        </button>

        {/* Auth */}
        {isSignedIn ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary transition duration-150 ease-out hover:bg-primary/25"
            >
              {initials}
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute end-0 z-40 mt-1 w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
                  <p className="truncate px-3 py-1.5 text-xs text-muted-foreground">
                    {displayName ?? "Signed in"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground/80 transition duration-150 ease-out hover:bg-muted"
                  >
                    <History className="h-4 w-4" aria-hidden="true" />
                    History
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground/80 transition duration-150 ease-out hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignInClick}
            aria-label="Sign in"
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition duration-150 ease-out hover:bg-muted hover:text-foreground"
          >
            <LogIn className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}