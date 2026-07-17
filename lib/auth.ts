import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
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
    admin({
      defaultRole: "user",
      adminRole: "admin",
      adminEmails: ["ajaxmilton@hotmail.com"],
    }),
  ],
});
