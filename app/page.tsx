"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "model";
  parts: { text: string }[];
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // scroll to the newest message whenever something changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", parts: [{ text }] };
    setMessages([...messages, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });

      let data: { reply?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // the server sent something that is not JSON
      }

      const reply = data.reply;
      if (!res.ok || !reply) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setMessages((prev) => [...prev, { role: "model", parts: [{ text: reply }] }]);
    } catch (err) {
      console.error(err);
      setMessages(messages);
      setInput(text);
      setError(
        err instanceof TypeError
          ? "Could not reach the server. Check your internet connection and try again."
          : err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#f3f5f9", color: "#1a1a1a", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: "#1d4e89", color: "#fff", padding: "16px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>VU Assistant</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            Ask about admissions, programs, FAQs, and examination rules
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
        <div
          style={{
            background: "#fff8e1",
            border: "1px solid #f0dca0",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          Answers come from VU web pages collected in October 2026. Please confirm important
          details (fees, dates, deadlines) on the official VU website.
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #dde2ea",
            borderRadius: 12,
            padding: 16,
            height: "55vh",
            overflowY: "auto",
            marginBottom: 12,
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>
              Ask me a question about VU to get started.
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "8px 14px",
                    borderRadius: 14,
                    background: isUser ? "#1d4e89" : "#eef1f6",
                    color: isUser ? "#fff" : "#1a1a1a",
                    lineHeight: 1.5,
                  }}
                >
                  <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                </div>
              </div>
            );
          })}

          {loading && <div style={{ color: "#6b7280" }}>Assistant is typing...</div>}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div
            style={{
              background: "#fdecea",
              color: "#b3261e",
              border: "1px solid #f5c2c0",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask something..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #c5ccd8",
              background: "#fff",
              color: "#1a1a1a",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#8aa4c4" : "#1d4e89",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}