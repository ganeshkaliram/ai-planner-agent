import React, { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are an AI Curriculum Planner Agent. Generate personalized weekly study plans and update them over time.

Requirements:
- R1 Preference memory: Remember learning style, topics, pace, goals across the conversation
- R2 Conflict resolution: If user gives conflicting preferences, resolve intelligently
- R3 Chain-of-thought planning: Think step by step when building plans
- R4 Budget/time constraints: Respect stated time limits and budget (free/paid)
- R5 Plan revision logic: Revise plans based on feedback without starting from scratch

Format study plans with days of the week, topics, resources, and time estimates.
On first interaction, ask for: goal/topic, hours per day, budget (free/paid), learning style (video/reading/practice).
End plan outputs with a brief "Memory Updated" note showing what you remembered.`;

export default function App() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [
      {
        role: "assistant",
        content:
          "👋 Hi! I'm your AI Curriculum Planner. I'll help you build a personalized weekly study plan.\n\nTo get started, tell me:\n1. What do you want to learn?\n2. How many hours per day can you study?\n3. Budget preference — free resources only, or paid is okay?\n4. Learning style — videos, reading, or hands-on practice?",
      },
    ]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [keyEntered, setKeyEntered] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const extractMemory = (text: string) => {
    const newMem = { ...memory };
    const patterns = [
      { key: "goal", regex: /(?:want to learn|learn|studying)\s+([^.,\n]+)/i },
      { key: "hours", regex: /(\d+)\s*hours?\s*(?:per day|a day|daily)/i },
      { key: "budget", regex: /(free|paid)/i },
      { key: "style", regex: /(video|reading|practice|hands-on)/i },
    ];
    patterns.forEach(({ key, regex }) => {
      const match = text.match(regex);
      if (match) newMem[key] = match[1].trim();
    });
    return newMem;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    const newMem = extractMemory(input);
    setMemory(newMem);
    const memCtx =
      Object.keys(newMem).length > 0
        ? `\n\nUser memory: ${JSON.stringify(newMem)}`
        : "";
    const geminiHistory = updatedMessages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT + memCtx }] },
            contents: [
              ...geminiHistory,
              { role: "user", parts: [{ text: input }] },
            ],
            generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
          }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, something went wrong.";
      setMessages([...updatedMessages, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: `Error: ${e.message}` },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const memTags = Object.entries(memory).filter(([, v]) => v);

  const features = [
    {
      icon: "🧠",
      title: "Preference Memory",
      desc: "Remembers your goals, pace, and learning style across sessions",
    },
    {
      icon: "⚡",
      title: "Conflict Resolution",
      desc: "Detects and resolves conflicting preferences intelligently",
    },
    {
      icon: "🔗",
      title: "Chain-of-Thought",
      desc: "Plans step-by-step with visible reasoning",
    },
    {
      icon: "⏱️",
      title: "Time & Budget Aware",
      desc: "Respects your daily hours and free/paid resource limits",
    },
    {
      icon: "✏️",
      title: "Plan Revision",
      desc: "Updates your plan based on feedback without starting over",
    },
  ];

  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(135deg,#080c18,#0d1b2a)",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        color: "#e2e8f0",
        overflow: "hidden",
      }}
    >
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#3b82f6;animation:bounce 1.2s infinite;margin:0 2px}
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        .msg{animation:fadeUp .3s ease}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        textarea:focus{outline:none}
        .feat-card:hover{background:rgba(37,99,235,0.12) !important;border-color:rgba(37,99,235,0.4) !important}
        .send-btn:hover:not(:disabled){background:#1d4ed8 !important}
      `}</style>

      {/* Top Header Bar */}
      <div
        style={{
          width: "100%",
          padding: "14px 24px",
          borderBottom: "1px solid rgba(37,99,235,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(8,12,24,0.8)",
          backdropFilter: "blur(10px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              background: "linear-gradient(135deg,#2563eb,#7c3aed)",
              borderRadius: "10px",
              padding: "8px",
              fontSize: "20px",
            }}
          >
            🎓
          </div>
          <div>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 700,
                background: "linear-gradient(90deg,#60a5fa,#a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI Curriculum Planner
            </h1>
            <p style={{ fontSize: "11px", color: "#475569" }}>
              UC #13 · Memory + Planning Agent · Powered by Gemini
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {keyEntered && (
            <span
              style={{
                fontSize: "11px",
                color: "#4ade80",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid #16a34a",
                borderRadius: "20px",
                padding: "3px 10px",
              }}
            >
              ● Live
            </span>
          )}
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              background: keyEntered
                ? "rgba(34,197,94,0.15)"
                : "rgba(37,99,235,0.15)",
              border: `1px solid ${keyEntered ? "#16a34a" : "#2563eb"}`,
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "12px",
              color: keyEntered ? "#4ade80" : "#60a5fa",
              cursor: "pointer",
            }}
          >
            {keyEntered ? "✓ Gemini Connected" : "Set API Key"}
          </button>
        </div>
      </div>

      {/* API Key Input */}
      {showKeyInput && (
        <div
          style={{
            padding: "12px 24px",
            background: "rgba(37,99,235,0.06)",
            borderBottom: "1px solid rgba(37,99,235,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <p
            style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}
          >
            Get free key at{" "}
            <strong style={{ color: "#60a5fa" }}>aistudio.google.com</strong>:
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            style={{
              flex: 1,
              background: "rgba(15,23,42,0.8)",
              border: "1px solid #1e3a5f",
              borderRadius: "8px",
              padding: "7px 12px",
              color: "#e2e8f0",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            onClick={() => {
              setKeyEntered(true);
              setShowKeyInput(false);
            }}
            style={{
              background: "#2563eb",
              border: "none",
              borderRadius: "8px",
              padding: "7px 18px",
              color: "white",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Connect
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Panel */}
        <div
          style={{
            width: "300px",
            flexShrink: 0,
            borderRight: "1px solid rgba(37,99,235,0.15)",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflowY: "auto",
            background: "rgba(8,12,24,0.4)",
          }}
        >
          {/* Memory Section */}
          <div>
            <p
              style={{
                fontSize: "11px",
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "10px",
              }}
            >
              📍 User Memory
            </p>
            {memTags.length > 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {memTags.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      background: "rgba(124,58,237,0.1)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#7c3aed",
                        textTransform: "capitalize",
                      }}
                    >
                      {k}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#a78bfa",
                        fontWeight: 600,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(37,99,235,0.05)",
                  border: "1px dashed rgba(37,99,235,0.2)",
                  borderRadius: "10px",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "12px", color: "#334155" }}>
                  No memory yet.
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#1e3a5f",
                    marginTop: "4px",
                  }}
                >
                  Start chatting to build memory!
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(37,99,235,0.1)" }} />

          {/* Features */}
          <div>
            <p
              style={{
                fontSize: "11px",
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "10px",
              }}
            >
              🚀 Features
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {features.map((f) => (
                <div
                  key={f.title}
                  className="feat-card"
                  style={{
                    background: "rgba(37,99,235,0.06)",
                    border: "1px solid rgba(37,99,235,0.15)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    transition: "all 0.2s",
                    cursor: "default",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "3px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{f.icon}</span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#93c5fd",
                      }}
                    >
                      {f.title}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#475569",
                      lineHeight: "1.4",
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              borderTop: "1px solid rgba(37,99,235,0.1)",
              paddingTop: "16px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "10px",
              }}
            >
              📊 Session Stats
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {[
                { label: "Messages", value: messages.length },
                { label: "Memory Items", value: memTags.length },
                {
                  label: "User Msgs",
                  value: messages.filter((m) => m.role === "user").length,
                },
                {
                  label: "AI Replies",
                  value: messages.filter((m) => m.role === "assistant").length,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "rgba(37,99,235,0.06)",
                    borderRadius: "8px",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#60a5fa",
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ fontSize: "10px", color: "#475569" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chat Panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              overflowY: "auto",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className="msg"
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      flexShrink: 0,
                      marginRight: "10px",
                      marginTop: "2px",
                    }}
                  >
                    🎓
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "75%",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg,#1d4ed8,#7c3aed)"
                        : "rgba(13,27,42,0.9)",
                    border:
                      msg.role === "user"
                        ? "none"
                        : "1px solid rgba(37,99,235,0.2)",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      flexShrink: 0,
                      marginLeft: "10px",
                      marginTop: "2px",
                    }}
                  >
                    👤
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🎓
                </div>
                <div
                  style={{
                    background: "rgba(13,27,42,0.9)",
                    border: "1px solid rgba(37,99,235,0.2)",
                    borderRadius: "18px 18px 18px 4px",
                    padding: "14px 18px",
                  }}
                >
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
            {!keyEntered && messages.length === 1 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#334155",
                  fontSize: "14px",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔑</div>
                <p>
                  Click{" "}
                  <strong style={{ color: "#60a5fa" }}>"Set API Key"</strong> in
                  the top right to connect Gemini and start planning!
                </p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 24px 20px",
              borderTop: "1px solid rgba(37,99,235,0.15)",
              background: "rgba(8,12,24,0.6)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                background: "rgba(13,27,42,0.9)",
                border: "1px solid rgba(37,99,235,0.3)",
                borderRadius: "14px",
                padding: "10px 10px 10px 16px",
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  keyEntered
                    ? "Tell me what you want to learn, your schedule, or ask to revise your plan..."
                    : "Connect your Gemini API key first..."
                }
                disabled={!keyEntered}
                rows={1}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  resize: "none",
                  fontFamily: "inherit",
                  lineHeight: "1.5",
                  paddingTop: "4px",
                  outline: "none",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim() || !keyEntered}
                style={{
                  background:
                    loading || !input.trim() || !keyEntered
                      ? "#1e3a5f"
                      : "#2563eb",
                  border: "none",
                  borderRadius: "10px",
                  width: "40px",
                  height: "40px",
                  cursor:
                    loading || !input.trim() || !keyEntered
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "18px",
                  color: "white",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                →
              </button>
            </div>
            <p
              style={{
                fontSize: "10px",
                color: "#1e3a5f",
                textAlign: "center",
                marginTop: "6px",
              }}
            >
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
