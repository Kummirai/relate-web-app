import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { expo } from "@better-auth/expo";
import { client } from "@/lib/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

const dbName = process.env.MONGODB_DB || "test";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "https://relateworld.netlify.app",
  database: mongodbAdapter(client.db(dbName)),
  emailAndPassword: {
    enabled: true,
  },
  // Trust the mobile app's deep link scheme (relate://) so the Expo OAuth
  // flow can redirect the session back into the app, plus exp:// origins
  // when running in development.
  trustedOrigins: [
    "relate://",
    ...(process.env.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**", "http://localhost:8081"]
      : []),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
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
  ],
});
