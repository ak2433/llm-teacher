# Screens and Components — Detailed Reference

A file-by-file walkthrough of the main screens and reusable components, with a focus on how they work and where to change behavior.

---

## Screens (under `app/`)

### 1. Root layout — `app/_layout.tsx`

- **Role**: Wraps the whole app. Provides theme (light/dark) and the top-level **Stack** navigator.
- **What it renders**: `ThemeProvider` → `Stack` with:
  - `(tabs)` — the tab group (no header).
  - `modal` — optional modal screen.
- **Notable**: `useColorScheme()` from `@/hooks/use-color-scheme` drives theme. No direct “profile” logic here; profile is just one of the tab screens.

---

### 2. Tab layout — `app/(tabs)/_layout.tsx`

- **Role**: Defines the two tabs (Chat and Profile) and tab bar options.
- **What it does**:
  - Renders `<Tabs>` with `screenOptions`: header off, tab bar **hidden** (`display: 'none'`), custom tab button (haptic).
  - Registers `chat` and `profile` as tab screens with titles and icons.
- **Important**: Because the tab bar is hidden, the user only reaches Profile by code navigation (e.g. Profile button → `router.push('/profile')`).

---

### 3. Chat screen — `app/(tabs)/chat.tsx`

- **Role**: Main chat UI and all chat logic (state, API call, navigation to profile).
- **State**:
  - `messages` — list of `Message` for the UI (id, text, timestamp, isSent).
  - `chatHistory` — list of `{ role, content }` sent to the backend (conversation history).
  - `isLoading` — true while waiting for the backend.
  - `showLandingPage` — `messages.length === 0` (show landing vs. message list).
- **API**: `API_URL` is chosen by platform (iOS localhost, Android emulator `10.0.2.2`, etc.). `sendToOllama` POSTs to `${API_URL}/chat` with `{ messages, model }`, then appends the assistant reply to `messages` and `chatHistory`.
- **Rendering**:
  - If `showLandingPage`: `<LandingPage onActionPress={handleActionPress} />` and `<ChatInput onSend={handleSend} />`.
  - Else: `<FlatList>` of `<MessageBubble message={...} />` and `<ChatInput onSend={handleSend} />`.
- **Profile navigation**: `handleActionPress('profile')` → `router.push('/profile')`. So the Profile **button** on the landing page is what brings the user to the Profile (Subjects) page.

---

### 4. Profile / Subjects screen — `app/(tabs)/profile.tsx`

- **Role**: The “Profile” page: subject list (search, select mode) and bottom profile block.
- **Data**: `SUBJECTS` is a constant array of `Subject` (id, name, lastMessage, icon, progress). No backend yet; you could later replace this with an API.
- **State**:
  - `searchQuery` — filters subjects by name.
  - `selectedSubjects` — ids of selected subjects (used in select mode).
  - `isSelectMode` — toggled by “Select” / “Cancel”; when true, list items toggle selection and show checkboxes.
- **Derived**: `filteredSubjects = SUBJECTS.filter(...searchQuery...)`.
- **UI sections**:
  - **Header**: Profile avatar “JD”, title “Subjects”, “New subject” button (navigates to `/chat`).
  - **Search**: `TextInput` bound to `searchQuery` and `setSearchQuery`.
  - **Count + Select**: “N subjects” and “Select”/“Cancel” that toggles `isSelectMode` and clears selection on cancel.
  - **List**: `ScrollView` of subject rows; each row shows icon, name, lastMessage, and either a progress bar or (in select mode) a checkbox. Tapping a row in select mode toggles selection; otherwise logs (you can replace with navigation to a subject detail screen).
  - **Bottom**: Large avatar “JD”, “John Doe”, “john.doe@email.com”, “Edit Profile” and “Settings” buttons (handlers not wired yet).
- **Styles**: Imported from `./ProfileScreen.styles` so the file stays readable.

---

## Reusable components (under `components/`)

### 5. LandingPage — `components/chat/LandingPage.tsx`

- **Role**: Shown on the Chat screen when there are no messages. Displays “Free plan • Upgrade”, “Welcome Back”, and action buttons (e.g. “Profile”).
- **Props**: `onActionPress?: (actionId: string) => void`. When a button is pressed, it calls `onActionPress(button.id)`.
- **Data**: `actionButtons` array; currently includes `{ id: 'profile', label: 'Profile', icon: 'school' }`. Adding more entries here adds more buttons; in `chat.tsx`, `handleActionPress` must handle their ids (e.g. `profile` → `router.push('/profile')`, others might send a preset message).
- **This is where the “Profile” button lives** that takes the user to the Profile (Subjects) page.

---

### 6. ChatInput — `components/chat/ChatInput.tsx`

- **Role**: Single-line text input and send button for the chat.
- **Props**: `onSend: (message: string) => void`. Called with the trimmed text when the user sends.
- **State**: `message` — current input. Cleared after a successful send.
- **Behavior**: Send disabled when `message.trim()` is empty. Uses `KeyboardAvoidingView` so the input stays visible on keyboard open. Theming via `useColorScheme()`.

---

### 7. MessageBubble — `components/chat/MessageBubble.tsx`

- **Role**: Renders one chat message (user or assistant) with styling and timestamp.
- **Props**: `message: Message` where `Message = { id, text, timestamp, isSent }`.
- **No state**: Pure presentational. Uses `message.isSent` to pick sent vs. received styles and `useColorScheme()` for light/dark.

---

## Backend — `python/main.py`

- **Role**: FastAPI app that the React app calls for chat and (optionally) health/models.
- **Endpoints**:
  - **POST `/chat`**: Body `{ messages: [{ role, content }], model }`. Forwards to Ollama and returns `{ message, model }`. Used by `chat.tsx`’s `sendToOllama`.
  - **GET `/health`**: Returns `{ status: "healthy" }`.
  - **GET `/models`**: Returns list of Ollama models (not used by the current React UI but available).
- **CORS**: Enabled for all origins so the mobile app can call it. In production you’d restrict origins.
- **Ollama**: Expects Ollama running locally with the requested model (e.g. `llama3.1:8b`).

---

## Data flow summary

| Screen / Component | Data in | Data out / side effect |
|--------------------|--------|-------------------------|
| **Chat**           | `messages`, `chatHistory`, `isLoading` | POST to backend, append messages; `router.push('/profile')` on Profile action |
| **Profile**        | `searchQuery`, `selectedSubjects`, `isSelectMode`, `SUBJECTS` | `router.push('/chat')` from “New subject”; future: subject detail, edit profile |
| **LandingPage**    | `actionButtons` (static) | Calls `onActionPress(id)` (e.g. `'profile'`) |
| **ChatInput**      | `message` (local state) | Calls `onSend(message)` |
| **MessageBubble**  | `message` (prop) | None (display only) |
| **Backend**        | Request body | Ollama response → JSON `{ message }` |

---

## Where to change what

- **Add another way to open Profile**: Call `router.push('/profile')` from any screen that has `useRouter()` (e.g. a header icon).
- **Change what “Profile” does**: In `chat.tsx`, change `handleActionPress` for `actionId === 'profile'`.
- **Change subject list**: Edit `SUBJECTS` in `profile.tsx` or replace with `useState` + `fetch` from an API.
- **Wire “Edit Profile” / “Settings”**: Add `onPress` handlers in `profile.tsx` (e.g. `router.push('/edit-profile')` or open a modal).
- **Change chat API**: Edit `API_URL` and the body in `sendToOllama` in `chat.tsx`; adjust `python/main.py` to match the expected request/response shape.

These docs plus the React/TypeScript guide should be enough to navigate and extend the app from a Python-centric perspective.
