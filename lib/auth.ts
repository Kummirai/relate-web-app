// lib/auth.ts
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "@/lib/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: mongodbAdapter(client.db()),
  emailAndPassword: {
    enabled: true,
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
