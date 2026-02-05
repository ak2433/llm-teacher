# LLM Teacher — Documentation Index

Docs are written for someone who is **comfortable with Python** and new to **React** and **TypeScript**. Start with the overview, then use the others as needed.

---

## 1. [APP_OVERVIEW.md](./APP_OVERVIEW.md)

**Start here.** What the app does, tech stack, and project structure. Use it as a map to find the right files.

---

## 2. [REACT_AND_TYPESCRIPT_FOR_PYTHON_DEVS.md](./REACT_AND_TYPESCRIPT_FOR_PYTHON_DEVS.md)

React and TypeScript concepts with **Python analogies**: components, props, state, JSX, styles, events, types, hooks. Read this when you’re editing `.tsx` files and want to understand the patterns.

---

## 3. [NAVIGATION_AND_FLOWS.md](./NAVIGATION_AND_FLOWS.md)

How **routing** works (file-based Expo Router) and the main **user flows**:

- Profile button on the chat landing page → Profile (Subjects) screen
- Sending a message → backend → Ollama → UI update
- “New subject” on Profile → back to Chat

---

## 4. [SCREENS_AND_COMPONENTS.md](./SCREENS_AND_COMPONENTS.md)

**Screen-by-screen and component-by-component** reference: what each file does, what state it uses, and where to change behavior (e.g. adding navigation, wiring buttons, changing the subject list).

---

## Suggested order

1. **APP_OVERVIEW** — get the big picture.
2. **REACT_AND_TYPESCRIPT_FOR_PYTHON_DEVS** — before editing UI logic.
3. **NAVIGATION_AND_FLOWS** — when you care how the user gets to the Profile page.
4. **SCREENS_AND_COMPONENTS** — when you’re changing a specific screen or component.

All files are Markdown (`.md`) and can be opened in any editor or on GitHub.
