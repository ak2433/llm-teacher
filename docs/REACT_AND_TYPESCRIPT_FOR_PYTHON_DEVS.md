# React and TypeScript — For Python Developers

This doc explains the main ideas in this codebase using analogies to Python. You don’t need to know React or TypeScript beforehand.

---

## 1. Components ≈ Functions (or classes) that return “UI”

In Python you might have a function that returns a string or a dict. In React, a **component** is a function that returns a **description of the UI** (written in JSX, which looks like HTML inside JavaScript).

```tsx
// React/TypeScript
export default function ProfileScreen() {
  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}
```

Rough Python analogy: a function that returns a tree of “widget” objects that the framework then turns into native views.

- **Export default** ≈ “this is the main thing this file provides.” Other files do `import ProfileScreen from './profile'`.
- **Capitalized name** (`ProfileScreen`) is a React convention for components.

---

## 2. Props ≈ Function arguments (read-only)

Data is passed **into** a component via **props**. The component does not change them; they’re like keyword arguments.

```tsx
// Parent passes onActionPress and the child calls it with an id
<LandingPage onActionPress={handleActionPress} />
```

```tsx
// In LandingPage.tsx — props are one object argument
type LandingPageProps = {
  onActionPress?: (actionId: string) => void;
};

export function LandingPage({ onActionPress }: LandingPageProps) {
  // ...
  onActionPress?.(button.id);  // optional chaining: call if defined
}
```

Python analogy:

```python
def landing_page(on_action_press=None):
    if on_action_press:
        on_action_press(button_id)
```

- **`?:` in TypeScript** = optional property.
- **`(actionId: string) => void`** = function that takes a string and returns nothing (like `Callable[[str], None]` in Python typing).

---

## 3. State ≈ Mutable data that lives inside the component

When the UI needs to change over time (user types, toggles something), that data is stored in **state**. Updating state causes the component to re-render with the new value.

```tsx
const [searchQuery, setSearchQuery] = useState('');
const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
```

- **`useState(initialValue)`** returns `[currentValue, setterFunction]`. You **must** use the setter to change the value; never assign to the variable and expect the UI to update.
- Python analogy: instance variables on an object, but the framework re-runs the “render” function whenever you call the setter.

Important: if you do `selectedSubjects.push(id)` and then `setSelectedSubjects(selectedSubjects)`, React may not see a change (same reference). In this app we do:

```tsx
setSelectedSubjects([...selectedSubjects, id]);  // new array
```

So: **treat state as immutable** — create new objects/arrays when updating.

---

## 4. JSX — The “HTML-like” syntax

What looks like HTML inside `.tsx` is **JSX**. It gets compiled to JavaScript. Rules:

- **One root** per return (or use `<>...</>` fragment).
- **`className` in web** → in React Native we use **`style`** (and no HTML tags).
- **Curly braces `{}`** = “this is JavaScript”: expressions, variables, function calls.

```tsx
<View style={styles.container}>
  <Text>{subject.name}</Text>
  {isSelectMode && <View style={styles.checkbox} />}
</View>
```

- **`{subject.name}`** — embed a value.
- **`{isSelectMode && <View ... />}`** — if `isSelectMode` is true, render the `View`; otherwise render nothing (like `is_select_mode and widget` in a template).

---

## 5. TypeScript in this project — Types for props and data

TypeScript adds static types. You’ll see:

- **Interfaces** = shape of an object (like a TypedDict or a dataclass without methods):

```ts
interface Subject {
  id: string;
  name: string;
  lastMessage: string;
  icon: string;
}
```

- **Type for props**:

```ts
type MessageBubbleProps = {
  message: Message;
};
```

- **Function types**: `(text: string) => void` means “function that takes a string and returns nothing.”
- **Arrays**: `string[]` or `Message[]` (like `list[str]` or `list[Message]` in Python).
- **Optional**: `onActionPress?: (id: string) => void` — optional prop.

You don’t have to type everything; the app uses types mainly for props and for data structures like `Message` or `Subject`.

---

## 6. Styles — No CSS file; style objects in JS

React Native doesn’t use CSS files. Styles are plain JavaScript objects, usually from **StyleSheet.create**:

```ts
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
```

- **flex: 1** ≈ “take remaining space” (flexbox).
- **flexDirection: 'row'** = horizontal layout.
- Units are often omitted (numbers = density-independent pixels).

You can also pass an array of style objects; later entries override earlier ones:

```tsx
style={[styles.subjectItem, selectedSubjects.includes(subject.id) && styles.subjectItemSelected]}
```

---

## 7. Event handlers — Passing functions

Handlers are just functions. You pass them as props or use them in `onPress` / `onChangeText`:

```tsx
<TouchableOpacity onPress={() => toggleSubjectSelection(subject.id)}>
<TextInput value={searchQuery} onChangeText={setSearchQuery} />
```

- **`onPress={() => ...}`** — inline function so we can pass `subject.id`.
- **`onChangeText={setSearchQuery}`** — the runtime calls `setSearchQuery` with the new text; perfect for controlled input.

---

## 8. Lists — key is required

When rendering a list, each top-level element should have a **key** (unique string) so React can track items:

```tsx
{filteredSubjects.map((subject) => (
  <TouchableOpacity key={subject.id} ...>
```

Like a unique `id` in a Django template `{% for %}` or a list comprehension that produces items with stable identities.

---

## 9. Hooks — useRouter, useColorScheme, useEffect

- **useRouter()** (from Expo Router): returns an object with `push`, `back`, etc. — like a navigation helper.
- **useColorScheme()**: returns `'light' | 'dark'` from the app theme.
- **useEffect(() => { ... }, [deps])**: run side effects after render (e.g. scroll when `messages` changes). Dependency array `[deps]` means “re-run when these change.”

Python analogy: `useEffect` is a bit like reacting to “when this state changed, do this side effect,” instead of doing it inside the render logic.

---

## 10. Imports and path alias

You’ll see `@/components/...` or `@/hooks/...`. The `@` is an alias for the project root (set in `tsconfig.json`), so:

- `import { ChatInput } from '@/components/chat/ChatInput';`  
  is like importing from a package under the project root.

---

## Summary table (Python → React/TS)

| Concept        | Python analogy              | In this app                          |
|----------------|-----------------------------|--------------------------------------|
| Component      | Function returning UI       | Function returning JSX               |
| Props          | Keyword arguments (read-only) | One object argument, often typed  |
| State          | Mutable instance data       | `useState`, update only via setter   |
| Event handler  | Callback function           | `onPress={fn}`, `onChangeText={fn}`   |
| List render    | for-loop / list comp        | `array.map(item => <Item key={id} />)`|
| Styles         | Dict of CSS-like keys       | `StyleSheet.create({ ... })`         |
| Types          | type hints, TypedDict       | `interface`, `type`, `: string`      |

If you keep “components = functions, props = arguments, state = mutable data that triggers re-render,” you’ll be able to follow and modify this app’s React and TypeScript code more easily.
