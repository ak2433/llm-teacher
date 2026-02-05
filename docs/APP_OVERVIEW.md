# LLM Teacher App — Overview

This document describes what the app does, the tech stack, and where everything lives. Think of it as the "project README" from a product and architecture perspective.

---

## What the app does

- **Chat screen**: User sees a welcome/landing view with a "Profile" action. After sending a message, the view becomes a chat list. Messages are sent to a **Python FastAPI backend**, which talks to **Ollama** (local LLM) and returns replies.
- **Profile / Subjects screen**: Lists subjects (e.g. Mathematics, History) with search, select mode, and a bottom profile section (name, email, Edit Profile, Settings). The user can reach this screen by:
  - Tapping the **Profile** button on the chat landing page, or
  - Switching to the **Profile** tab (tabs exist in code but the tab bar is hidden).

So in short: **one main flow is “Chat → tap Profile → Profile/Subjects page,”** plus the app could be extended with a visible tab bar to switch between Chat and Profile.

---

## Tech stack

| Layer        | Technology |
|-------------|------------|
| **Mobile app** | React Native (Expo), TypeScript |
| **Routing** | Expo Router (file-based) |
| **Backend** | Python, FastAPI, Pydantic |
| **LLM**     | Ollama (local), called from the backend |

The app uses **Expo** so you can run it on iOS, Android, or web without separate native project setup.

---

## Project structure (where to look)

```
llm-teacher/
├── app/                    # Screens and routing (Expo Router)
│   ├── _layout.tsx         # Root layout: theme + stack (tabs + modal)
│   ├── (tabs)/             # Tab group (Chat + Profile)
│   │   ├── _layout.tsx     # Tab layout (tab bar currently hidden)
│   │   ├── chat.tsx        # Chat screen
│   │   ├── profile.tsx     # Profile / Subjects screen
│   │   └── ProfileScreen.styles.ts
│   └── modal.tsx           # Optional modal screen
├── components/             # Reusable UI pieces
│   └── chat/
│       ├── ChatInput.tsx   # Message input + send
│       ├── LandingPage.tsx # Welcome + "Profile" (and other) buttons
│       └── MessageBubble.tsx
├── constants/
│   └── theme.ts            # Colors, fonts
├── hooks/                  # Shared React hooks (e.g. light/dark)
├── python/
│   └── main.py             # FastAPI server + Ollama integration
└── docs/                   # This documentation
```

- **Screens** = files under `app/` that export a default component; the file path defines the URL/route.
- **Components** = reusable pieces used by screens; they live in `components/`.
- **Backend** = single FastAPI app in `python/main.py`; the React app calls it over HTTP.

---

## How the pieces connect

1. **User opens app** → Root layout loads → Tab layout shows **Chat** by default.
2. **On Chat**:
   - If there are no messages → `LandingPage` is shown; "Profile" button calls `router.push('/profile')`.
   - If there are messages → `FlatList` of `MessageBubble`s + `ChatInput`.
   - Sending a message → `chat.tsx` calls `fetch(API_URL + '/chat', ...)` with the conversation history; backend calls Ollama and returns the reply.
3. **Profile route** (`/profile`) → Renders `app/(tabs)/profile.tsx` (the Subjects/Profile screen).

Details of routing, components, and React/TypeScript concepts are in the other docs in `docs/`.

---

## Quick reference: key files for each feature

| What you care about      | File(s) |
|--------------------------|--------|
| App entry + global layout| `app/_layout.tsx` |
| Tabs (Chat vs Profile)   | `app/(tabs)/_layout.tsx` |
| Chat UI + API calls      | `app/(tabs)/chat.tsx` |
| “Profile” button → Profile page | `components/chat/LandingPage.tsx` + `chat.tsx` (handleActionPress) |
| Profile/Subjects screen  | `app/(tabs)/profile.tsx`, `ProfileScreen.styles.ts` |
| Backend + Ollama         | `python/main.py` |
| Theme (colors, etc.)     | `constants/theme.ts` |

Use this as a map; the other docs explain *how* these work in terms of React, TypeScript, and navigation.
