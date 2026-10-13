"use client";

import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  GraduationCap,
  Info,
  MessageCircle,
  Paperclip,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "model";
  parts: { text: string }[];
  sources?: { name: string; url?: string }[];
};

const suggestedQuestions = [
  {
    icon: GraduationCap,
    title: "Admissions",
    question: "How do I apply for admission?",
  },
  {
    icon: FileText,
    title: "Examinations",
    question: "What happens if I miss an exam?",
  },
  {
    icon: BookOpen,
    title: "Degree programs",
    question: "Which programs does VU offer?",
  },
  {
    icon: CalendarDays,
    title: "Study guidance",
    question: "Where can I find my study scheme?",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();

    if (!text || loading) return;

    const previousMessages = messages;

    const userMessage: Message = {
      role: "user",
      parts: [{ text }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: previousMessages.map(({ role, parts }) => ({
            role,
            parts,
          })),
        }),
      });

      let data: {
        reply?: string;
        sources?: { name: string; url?: string }[];
        error?: string;
      } = {};

      try {
        data = await res.json();
      } catch {
        // Handle responses that are not JSON.
      }

      if (!res.ok || !data.reply) {
        throw new Error(
          data.error || "Something went wrong. Please try again.",
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          parts: [{ text: data.reply! }],
          sources: data.sources,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages(previousMessages);
      // Only restore the question if the box is empty (don't overwrite new typing).
      setInput((current) => current || text);

      setError(
        err instanceof TypeError
          ? "Couldn't connect to the server. Check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-ink">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b-2 border-accent bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
              <GraduationCap
                className="size-6 text-brand"
                aria-hidden="true"
              />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                VU Assistant
              </h1>
              <p className="text-xs text-muted sm:text-sm">
                Your friendly student helpdesk
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-surface-soft px-3 py-2 text-xs font-medium text-brand sm:flex">
            <span className="size-2 rounded-full bg-brand" />
            Here to help
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6">
        {/* Important information */}
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-3 sm:p-4">
          <Info
            className="mt-0.5 size-5 shrink-0 text-brand"
            aria-hidden="true"
          />

          <p className="text-xs leading-5 text-muted sm:text-sm">
            Get help with admissions, programs, examinations and study
            information. Answers use VU web pages collected in October 2026.
            Please verify important dates, fees and deadlines on the official
            VU website.
          </p>
        </div>

        {/* Chat panel */}
        <section
          aria-label="Chat with VU Assistant"
          className="flex min-h-96 flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
        >
          {/* Messages */}
          <div
            className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {/* Welcome screen */}
            {messages.length === 0 && !loading && (
              <div className="mx-auto flex max-w-2xl flex-col items-center py-5 text-center sm:py-10">
                <div className="mb-5 flex size-20 items-center justify-center rounded-[28px] bg-accent-soft">
                  <MessageCircle
                    className="size-10 text-brand"
                    aria-hidden="true"
                  />
                </div>

                <p className="mb-2 text-sm font-semibold text-brand">
                  YOUR STUDENT COMPANION
                </p>

                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Hi, VU student!
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-muted sm:text-base">
                  What can I help you with today? Ask a question in your own
                  words, or choose a topic below to get started.
                </p>

                <div className="mt-8 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
                  {suggestedQuestions.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => void sendMessage(item.question)}
                        disabled={loading}
                        className="group rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-brand hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-soft">
                          <Icon
                            className="size-5 text-brand"
                            aria-hidden="true"
                          />
                        </span>

                        <span className="block text-sm font-semibold text-ink">
                          {item.title}
                        </span>

                        <span className="mt-1 block text-sm leading-5 text-muted">
                          {item.question}
                        </span>

                        <span className="mt-3 flex items-center gap-1 text-sm font-medium text-brand transition group-hover:translate-x-1">
                          Ask question
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";

              const showSources =
                !isUser &&
                msg.sources &&
                msg.sources.length > 0 &&
                !/don['’]?t know|do not know|can only help/i.test(
                  msg.parts[0].text,
                );

              return (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                      <GraduationCap
                        className="size-4 text-brand"
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  <div
                    className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[78%] ${
                      isUser
                        ? "rounded-br-md bg-brand text-white"
                        : "rounded-bl-md bg-surface-soft text-ink"
                    }`}
                  >
                    <div
                      className={`wrap-break-word text-sm leading-7 sm:text-base [&_a]:font-medium [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ol]:my-2 [&_ol]:list-decimal [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-background [&_pre]:p-3 [&_code]:wrap-break-word [&_h1]:my-3 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:my-3 [&_h2]:text-base [&_h2]:font-bold [&_strong]:font-semibold ${
                        isUser ? "[&_a]:text-white" : "[&_a]:text-brand"
                      }`}
                    >
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {msg.parts[0].text}
                      </ReactMarkdown>
                    </div>

                    {showSources && (
                      <div className="mt-4 border-t border-border pt-3">
                        <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted">
                          <Paperclip
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Helpful sources
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {msg.sources!.map((source, sourceIndex) => (
                            <span
                              key={`${source.name}-${sourceIndex}`}
                              className="inline-flex max-w-full rounded-lg bg-surface px-2.5 py-1.5 text-xs"
                            >
                              {source.url ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="break-all font-medium text-brand hover:underline"
                                >
                                  {source.name}
                                  <ExternalLink
                                    className="ml-1 inline size-3"
                                    aria-hidden="true"
                                  />
                                </a>
                              ) : (
                                <span className="wrap-break-word text-muted">
                                  {source.name}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-end gap-2" role="status">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                  <GraduationCap
                    className="size-4 text-brand"
                    aria-hidden="true"
                  />
                </div>

                <div className="rounded-2xl rounded-bl-md bg-surface-soft px-4 py-3">
                  <p className="text-sm text-muted">Thinking of an answer...</p>

                  <div className="mt-2 flex gap-1">
                    <span className="size-2 animate-bounce rounded-full bg-brand" />
                    <span className="size-2 animate-bounce rounded-full bg-brand [animation-delay:150ms]" />
                    <span className="size-2 animate-bounce rounded-full bg-brand [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-bg p-3 text-sm text-danger sm:mx-6"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p className="flex-1 leading-5">{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="font-semibold hover:opacity-70"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Message composer */}
          <div className="border-t border-border bg-surface p-3 sm:p-5">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
              <label htmlFor="chat-input" className="sr-only">
                Ask VU Assistant a question
              </label>

              <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-accent/60">
                <textarea
                  id="chat-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask anything about VU..."
                  rows={1}
                  ref={(element) => {
                    inputRef.current = element;
                    if (element) {
                      element.style.height = "auto";
                      element.style.height = `${Math.min(
                        element.scrollHeight,
                        120,
                      )}px`;
                    }
                  }}
                  className="max-h-30 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-ink outline-none placeholder:text-muted sm:text-base"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">
                    {loading ? "Sending..." : "Send"}
                  </span>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 px-1 text-xs text-muted">
                <span>Ask naturally. We are here to help.</span>
                <span className="hidden sm:inline">
                  Enter to send · Shift + Enter for a new line
                </span>
              </div>
            </form>
          </div>
        </section>

        <footer className="py-5 text-center text-xs leading-5 text-muted">
          Made for VU students by Isha Noor.
          <span className="mx-2">·</span>
          Always verify important information with official VU sources.
        </footer>
      </main>
    </div>
  );
}