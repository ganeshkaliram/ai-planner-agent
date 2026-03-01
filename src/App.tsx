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

    // Build Gemini conversation history
    const geminiHistory = updatedMessages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0a0e1a,#0d1b2a)",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#e2e8f0",
      }}
    >
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        .dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:#3b82f6; animation:bounce 1.2s infinite; margin:0 2px; }
        .dot:nth-child(2){animation-delay:.2s} .dot:nth-child(3){animation-delay:.4s}
        @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        .msg{animation:fadeUp .3s ease}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        textarea:focus{outline:none}
        .keybtn:hover{background:rgba(37,99,235,0.3) !important}
      `}</style>

      {/* Header */}
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          padding: "20px 20px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "linear-gradient(135deg,#2563eb,#7c3aed)",
              borderRadius: "10px",
              padding: "8px",
              fontSize: "18px",
            }}
          >
            🎓
          </div>
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                background: "linear-gradient(90deg,#60a5fa,#a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI Curriculum Planner
            </h1>
            <p style={{ fontSize: "11px", color: "#475569" }}></p>
          </div>
        </div>
        <button
          className="keybtn"
          onClick={() => setShowKeyInput(!showKeyInput)}
          style={{
            background: keyEntered
              ? "rgba(34,197,94,0.15)"
              : "rgba(37,99,235,0.15)",
            border: `1px solid ${keyEntered ? "#16a34a" : "#2563eb"}`,
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "11px",
            color: keyEntered ? "#4ade80" : "#60a5fa",
            cursor: "pointer",
          }}
        >
          {keyEntered ? "✓ Gemini Connected" : "Set API Key"}
        </button>
      </div>

      {/* API Key Input */}
      {showKeyInput && (
        <div
          style={{
            width: "100%",
            maxWidth: "760px",
            margin: "12px 20px 0",
            background: "rgba(37,99,235,0.08)",
            border: "1px solid rgba(37,99,235,0.3)",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <p
            style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}
          >
            Get your free key at{" "}
            <strong style={{ color: "#60a5fa" }}>aistudio.google.com</strong> →
            Get API Key
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
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
                padding: "8px 12px",
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
                padding: "8px 16px",
                color: "white",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Memory Tags */}
      {memTags.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: "760px",
            padding: "10px 20px 0",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "11px", color: "#475569" }}>Memory:</span>
          {memTags.map(([k, v]) => (
            <span
              key={k}
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.4)",
                borderRadius: "20px",
                padding: "2px 10px",
                fontSize: "10px",
                color: "#a78bfa",
              }}
            >
              {k}: {v}
            </span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "760px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          overflowY: "auto",
          minHeight: "calc(100vh - 160px)",
          maxHeight: "calc(100vh - 160px)",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className="msg"
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  flexShrink: 0,
                  marginRight: "8px",
                  marginTop: "2px",
                }}
              >
                🎓
              </div>
            )}
            <div
              style={{
                maxWidth: "80%",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg,#1d4ed8,#7c3aed)"
                    : "rgba(15,23,42,0.8)",
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
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
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
                background: "rgba(15,23,42,0.8)",
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
              padding: "20px",
              color: "#475569",
              fontSize: "13px",
            }}
          >
            👆 Click <strong style={{ color: "#60a5fa" }}>"Set API Key"</strong>{" "}
            above to connect Gemini and start planning!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{ width: "100%", maxWidth: "760px", padding: "8px 20px 20px" }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(37,99,235,0.3)",
            borderRadius: "14px",
            padding: "8px 8px 8px 14px",
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
              paddingTop: "5px",
              outline: "none",
              maxHeight: "100px",
              overflowY: "auto",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !keyEntered}
            style={{
              background:
                loading || !input.trim() || !keyEntered ? "#1e3a5f" : "#2563eb",
              border: "none",
              borderRadius: "10px",
              width: "38px",
              height: "38px",
              cursor:
                loading || !input.trim() || !keyEntered
                  ? "not-allowed"
                  : "pointer",
              fontSize: "16px",
              color: "white",
              transition: "all 0.2s",
            }}
          >
            →
          </button>
        </div>
        <p
          style={{
            fontSize: "10px",
            color: "#334155",
            textAlign: "center",
            marginTop: "6px",
          }}
        >
          Enter to send · Shift+Enter for new line · Memory persists across
          sessions
        </p>
      </div>
    </div>
  );
}
