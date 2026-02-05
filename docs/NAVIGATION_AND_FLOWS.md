# Navigation and User Flows

How the app decides which screen to show and how the user gets from the Chat screen to the Profile (Subjects) page.

---

## Routing: File-based with Expo Router

This project uses **Expo Router**. Routes are defined by the **file system** under `app/`:

- `app/_layout.tsx` → root layout (wraps the whole app).
- `app/(tabs)/_layout.tsx` → defines the tab group and which screens are tabs.
- `app/(tabs)/chat.tsx` → route **`/chat`** (or just `/` when (tabs) is the default).
- `app/(tabs)/profile.tsx` → route **`/profile`**.
- `app/modal.tsx` → route **`/modal`**.

Parentheses in `(tabs)` mean “group” — the URL doesn’t include the word “tabs.” So the real routes you care about are:

- `/` or `/chat` → Chat screen  
- `/profile` → Profile / Subjects screen  
- `/modal` → Modal screen (if you use it)

No separate router config file: **add a file under `app/` and you get a route.**

---

## Root layout → Tabs → Screens

1. **`app/_layout.tsx`**
   - Wraps the app in a theme (light/dark).
   - Defines a **Stack** with two screens:
     - `(tabs)` — the tab group (Chat + Profile). Header is hidden.
     - `modal` — presented as a modal.
   - So at startup the app shows the `(tabs)` stack, which then shows one of the tab screens.

2. **`app/(tabs)/_layout.tsx`**
   - Defines **Tabs** with two screens:
     - `chat` → Chat screen (title “Chat”, icon “message.fill”).
     - `profile` → Profile screen (title “Profile”, icon “person.fill”).
   - **Tab bar is hidden** (`tabBarStyle: { display: 'none' }`), so the user cannot switch tabs by tapping a tab bar. They only switch by:
     - Navigating in code (e.g. `router.push('/profile')`), or
     - You re-enabling the tab bar later.

So: **visually there’s no tab strip; navigation to Profile happens only when something (e.g. the Profile button) calls `router.push('/profile')`.**

---

## Flow: Profile button → Profile page

1. User is on the **Chat** screen with **no messages** (first visit or cleared).
2. The Chat screen renders **`LandingPage`** and passes a handler:
   - In `chat.tsx`:  
     `handleActionPress` is passed as `onActionPress` to `<LandingPage onActionPress={handleActionPress} />`.
3. **`LandingPage`** shows a “Profile” button (and any others in `actionButtons`). Each button’s `onPress` calls:
   - `onActionPress?.(button.id)`  
   So for the Profile button, it calls `onActionPress('profile')`.
4. In **`chat.tsx`**, `handleActionPress` is:
   - If `actionId === 'profile'` → `router.push('/profile')` and return.
   - Otherwise it uses the action id to send a predefined chat message.
5. **Expo Router** then shows the screen for `/profile`, which is **`app/(tabs)/profile.tsx`** — the Subjects/Profile screen.

So: **Profile button on the landing page → `handleActionPress('profile')` → `router.push('/profile')` → Profile (Subjects) screen.**

---

## Flow: Sending a message (Chat → Backend → UI)

1. User types in **`ChatInput`** and taps send.
2. **`ChatInput`** calls `onSend(message)` (the prop passed from `chat.tsx`). So `handleSend` in `chat.tsx` runs.
3. **`chat.tsx`**:
   - Appends the user message to local state (so it appears in the list).
   - Calls `sendToOllama(text)` which:
     - Builds `messages` (conversation history) and POSTs to `API_URL + '/chat'` (your FastAPI backend).
     - Backend (`python/main.py`) receives the body, calls Ollama, returns `{ message: "..." }`.
   - On success, appends the assistant message to state; the list re-renders with the new bubble.
4. **API_URL** in `chat.tsx` is set by platform (e.g. `localhost:8000` for iOS, `10.0.2.2:8000` for Android emulator). So the “backend” is your Python server; the React app is just an HTTP client.

---

## Flow: Profile screen → back to Chat

- In **`profile.tsx`**, the “New subject” button does `router.push('/chat')`, so the user goes back to the Chat screen.
- There is no explicit “Back” in the code you showed; the user can use the system back gesture/button (Expo Router handles that) or you can add a back button that calls `router.back()`.

---

## Summary

| User action              | Where it’s handled              | What happens                          |
|--------------------------|---------------------------------|----------------------------------------|
| Tap “Profile” on landing | `LandingPage` → `handleActionPress` in `chat.tsx` | `router.push('/profile')` → Profile screen |
| Send chat message        | `ChatInput` → `handleSend` in `chat.tsx` | POST to Python backend → Ollama → new message in list |
| Tap “New subject”        | `profile.tsx`                  | `router.push('/chat')` → Chat screen   |
| System back              | Expo Router                    | Pops current screen                    |

Routing is file-based; “Profile” is the route `/profile` implemented by `app/(tabs)/profile.tsx`.
