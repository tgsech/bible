import { createAuthClient } from "better-auth/react";

// Falls back to localhost:8787 (your backend's dev port) so this works
// with zero config locally. Set VITE_API_URL in a real .env for anything
// deployed.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export const authClient = createAuthClient({
  baseURL: API_URL,
});

// Re-exported so components can do `const { data: session } = useSession()`
// without importing from authClient directly everywhere.
export const { useSession, signIn, signOut, signUp } = authClient;
