import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { withCpuTiming } from "@/lib/api-timing";

const handlers = toNextJsHandler(auth);

export const GET = withCpuTiming("auth/[...all].GET", handlers.GET);
export const POST = withCpuTiming("auth/[...all].POST", handlers.POST);
