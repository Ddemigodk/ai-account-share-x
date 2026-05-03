import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.APP_SECRET || "your-secret-key";

export const authRouter = createRouter({
  // 登录
  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1, "用户名不能为空"),
        password: z.string().min(1, "密码不能为空"),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }

      if (!user.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "账号已被禁用" });
      }

      const validPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!validPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "密码错误" });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          level: user.level,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          level: user.level,
        },
      };
    }),

  // 获取当前登录用户
  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }
    return ctx.user;
  }),
});
