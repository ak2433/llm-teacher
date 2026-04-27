import { Platform } from 'react-native';

/**
 * Backend base URL (FastAPI). Port must match `uvicorn` (default 8000).
 *
 * Override for any platform: set EXPO_PUBLIC_API_URL in .env, e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.50:8000
 *
 * Platform notes:
 * - iOS simulator: localhost = your Mac/PC
 * - Android emulator: 10.0.2.2 = host machine's localhost
 * - Web: must use localhost (or LAN IP), not a stale default IP
 * - Physical device: use your computer's LAN IP; change default below or use .env
 */
const DEV_FALLBACK_LAN = 'http://10.0.0.23:8000';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
  Platform.select({
    ios: 'http://localhost:8000',
    android: 'http://10.0.2.2:8000',
    web: 'http://localhost:8000',
    default: DEV_FALLBACK_LAN,
  })!;

/**
 * Optional Ollama model tag for /chat. If unset, the backend uses OLLAMA_MODEL (env) or llama3.1:8b.
 * Set EXPO_PUBLIC_OLLAMA_MODEL=llama3.2:3b to match a smaller model after `ollama pull llama3.2:3b`.
 */
export const EXPO_OLLAMA_MODEL = process.env.EXPO_PUBLIC_OLLAMA_MODEL?.trim() || undefined;
