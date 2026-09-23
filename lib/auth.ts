import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { expo } from "@better-auth/expo";
import { client, getDb } from "@/lib/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin, oAuthProxy } from "better-auth/plugins";
import { createAuthMiddleware } from "@better-auth/core/api";
import { randomBytes } from "node:crypto";

const dbName = process.env.MONGODB_DB || "test";

/** How long a web OAuth session-bridge token stays valid before it expires. */
const WEB_BRIDGE_TTL_MS = 60_000;

/**
 * Web session bridge.
 *
 * The web app runs on a different origin than this API, so after an OAuth
 * login the provider callback ends here and the session cookie would be bound
 * to this domain. This plugin detects that the final redirect is going to a
 * trusted, cross-origin http(s) URL (the web app) and swaps the session cookie
 * for a short-lived, single-use `bridgeToken` query parameter instead.
 *
 * The web app then exchanges that token for the cookie and re-issues it on its
 * own domain (see app/api/auth/web-session-bridge and the web app's
 * /auth/oauth/callback route). This mirrors what @better-auth/expo does for
 * mobile deep links, but for web origins — without exposing the raw session
 * cookie in the URL.
 */
const webSessionBridge = {
  id: "web-session-bridge",
  hooks: {
    after: [
      {
        // Matches the auth endpoints that end an OAuth / email flow with a
        // redirect to the app (same set @better-auth/expo listens on).
        matcher: (context: any) =>
          !!(
            context.path?.startsWith("/callback") ||
            context.path?.startsWith("/oauth2/callback") ||
            context.path?.startsWith("/magic-link/verify") ||
            context.path?.startsWith("/verify-email")
          ),
        handler: createAuthMiddleware(async (ctx: any) => {
          const headers = ctx.context.responseHeaders;
          const location = headers?.get("location");
          if (!location) return;
          let redirectURL: URL;
          try {
            redirectURL = new URL(location);
          } catch {
            return;
          }
          // Only http(s) web redirects are bridgeable; deep links (relate://,
          // exp://) are handled by the expo plugin's own ?cookie= mechanism.
          if (redirectURL.protocol !== "http:" && redirectURL.protocol !== "https:") return;
          // Same-origin targets keep the normal cookie flow — nothing to do.
          if (!ctx.context.baseURL) return;
          try {
            if (redirectURL.origin === new URL(ctx.context.baseURL).origin) return;
          } catch {
            return;
          }
          // Only rewrite redirects to origins the app owner explicitly trusts.
          if (!ctx.context.isTrustedOrigin?.(location)) return;

          // Headers#get("set-cookie") is unreliable with multiple cookies, so
          // prefer getSetCookie() (Node 18+) and grab the session cookie, not
          // the state/oauth_state cleanup cookies that also ride along.
          const all =
            typeof headers?.getSetCookie === "function"
              ? (headers.getSetCookie() as string[])
              : [headers?.get("set-cookie")].filter(Boolean);
          const setCookie =
            all.find((c) => c.includes("session_token")) || all[0];
          if (!setCookie) return;

          const token = randomBytes(32).toString("hex");
          const db = await getDb();
          await db.collection("bridge_tokens").insertOne({
            token,
            cookie: setCookie,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + WEB_BRIDGE_TTL_MS),
          });
          // Don't also pin the session cookie to the API domain — the web app
          // is the only place the session should live for this origin.
          headers?.delete?.("set-cookie");
          redirectURL.searchParams.set("bridgeToken", token);
          ctx.setHeader("location", redirectURL.toString());
        }),
      },
    ],
  },
};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "https://relate-iota.vercel.app",
  database: mongodbAdapter(client.db(dbName)),
  emailAndPassword: {
    enabled: true,
  },
  // Trust the mobile app's deep link scheme (relate://) so the Expo OAuth
  // flow can redirect the session back into the app, plus exp:// origins
  // when running in development, and the web app's origins (localhost in
  // development; set WEB_APP_URL in production).
  trustedOrigins: [
    "relate://",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://relateworld.org",
    ...(process.env.WEB_APP_URL ? [process.env.WEB_APP_URL] : []),
    ...(process.env.NODE_ENV === "development"
      ? [
          "exp://",
          "exp://**",
          "exp://192.168.*.*:*/**",
          "http://localhost:8081",
        ]
      : []),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const adminEmails = ["ajaxmilton@hotmail.com"];
          return {
            data: {
              ...user,
              role: adminEmails.includes(user.email) ? "admin" : "user",
            },
          };
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    expo(),
    admin({
      defaultRole: "user",
      adminRole: "admin",
      adminEmails: ["ajaxmilton@hotmail.com"],
    }),
    // Cross-origin OAuth for the web app. relateworld.org proxies /api/* to
    // this server, so the oauth `state` cookie is only ever issued on the web
    // origin while Google/GitHub redirect_uri stays here. Without this plugin
    // the browser lands back on this origin for the callback, where the state
    // cookie (host-only on the web origin) is missing => state_mismatch.
    // Expo never hits this path: the expo client sends `x-skip-oauth-proxy`.
    oAuthProxy({
      currentURL:
        process.env.WEB_APP_URL ||
        (process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://relateworld.org"),
    }),
    webSessionBridge as any,
  ],
});