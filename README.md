# 🎓 AI Curriculum Planner Agent
### UC #13 · Memory + Planning Agent

> A personalized AI-powered study plan generator that remembers your preferences, resolves conflicts, and revises plans over time — powered by Google Gemini.

- 🔗 **Live Demo:** [https://jfy6gg.csb.app/](https://rg8njq-3000.csb.app/)
- 💻 **Built With:** React + TypeScript
- 🤖 **AI:** Google Gemini

---

## 📌 Objective

Generate **personalized weekly study plans** and update them over time based on user preferences, constraints, and feedback.

---

## ✅ Requirements Implemented

| ID | Requirement | Description |
|----|-------------|-------------|
| R1 | **Preference Memory** | Remembers user's learning goals, style, pace, and topics across the conversation |
| R2 | **Conflict Resolution** | Detects and resolves conflicting preferences intelligently (e.g. "2 hours/day" vs "I'm very busy") |
| R3 | **Chain-of-Thought Planning** | Reasons step-by-step when generating study plans, showing its logic |
| R4 | **Budget/Time Constraints** | Respects stated daily study hours and budget (free or paid resources only) |
| R5 | **Plan Revision Logic** | Revises existing plans based on user feedback without starting from scratch |

---

## 🧠 Domain Challenge

**Adapting memory preferences while avoiding stale data.**

The agent continuously tracks user preferences and updates them when new information is provided, ensuring old or outdated preferences don't override newer ones.

---

## 🚀 Features

- 💬 **Conversational chat interface** — natural language interaction
- 📍 **Live memory panel** — shows what the agent currently remembers about you
- 📊 **Session stats** — tracks messages, memory items, and AI replies
- 🌙 **Dark theme UI** — clean two-panel layout with full-width design
- ⚡ **Powered by Gemini 2.0 Flash** — fast, free AI responses

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React + TypeScript | Frontend framework |
| Google Gemini API | AI language model |
| Vite | Build tool |
| CSS-in-JS | Styling |
| LocalStorage | Session memory persistence |

---

## 🖥️ How to Run

### Option 1 — Run on CodeSandbox (Easiest)
1. Click the **Live Demo** badge above
2. Click **"Set API Key"** in the top right
3. Get a free key from [aistudio.google.com](https://aistudio.google.com)
4. Paste it and click **Connect**
5. Start chatting!

### Option 2 — Run Locally
```bash
# Clone the repo
git clone https://github.com/ganeshkaliram/ai-planner-agent.git

# Install dependencies
npm install

# Start dev server
npm run dev
```
Then open `http://localhost:5173` in your browser.

> **Note:** You need a free Gemini API key from [aistudio.google.com](https://aistudio.google.com)

---

## 💬 Example Usage

```
User: I want to learn Python, 2 hours a day, free resources, I prefer videos

Agent: Great! Here's your personalized weekly study plan:

Monday: Python Basics — Variables, Data Types (2 hrs)
  Resource: freeCodeCamp Python Full Course (YouTube)

Tuesday: Control Flow — If/Else, Loops (2 hrs)
  Resource: Corey Schafer Python Tutorials

...

Memory Updated: goal=Python, hours=2, budget=free, style=video
```

---

## 📁 Project Structure

```
ai-planner-agent/
├── src/
│   ├── App.tsx        # Main application component
│   ├── index.tsx      # Entry point
│   └── styles.css     # Global styles
├── public/
├── package.json
└── README.md
```

---

## 👤 Author

**Ganesh Kaliram**
Built for UC #13 — AI Curriculum Planner Agent Assignment

---

*Built with React, TypeScript, and Google Gemini AI*
