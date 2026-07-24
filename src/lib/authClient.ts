import { createAuthClient } from "better-auth/react";
import { API_URL } from "./api";

// Shares api.ts's API_URL rather than reading VITE_API_URL again here -
// two independent reads of the same env var is how they quietly drift
// (one gets updated, the other doesn't, and nobody notices until sign-in
// breaks but data-fetching still works, or vice versa).

export const authClient = createAuthClient({
  baseURL: API_URL,
});

// Re-exported so components can do `const { data: session } = useSession()`
// without importing from authClient directly everywhere.
export const { useSession, signIn, signOut, signUp } = authClient;