// lib/auth-client.ts
import { createAuthClient } from "better-auth/client";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    inferAdditionalFields<typeof auth>(), // gives you type-safe session.user.role
  ],
});
