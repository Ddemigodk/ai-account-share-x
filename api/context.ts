import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.APP_SECRET || "your-secret-key";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: {
    id: number;
    username: string;
    displayName: string;
    role: "admin" | "member";
    level: number;
  } | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const authHeader = opts.req.headers.get("authorization");
  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        username: string;
        displayName: string;
        role: "admin" | "member";
        level: number;
      };
      user = {
        id: decoded.userId,
        username: decoded.username,
        displayName: decoded.displayName,
        role: decoded.role,
        level: decoded.level,
      };
    } catch {
      // Token invalid, user stays null
    }
  }

  return { req: opts.req, resHeaders: opts.resHeaders, user };
}
