import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { toolCategories, accounts, users } from "@db/schema";
import { eq, asc } from "drizzle-orm";

export const resourceRouter = createRouter({
  // 获取工具类型列表（登录用户可见）
  listCategories: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const categories = await db
      .select()
      .from(toolCategories)
      .where(eq(toolCategories.isActive, true))
      .orderBy(asc(toolCategories.sortOrder));

    // 获取完整用户信息
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const userLevel = user?.level || ctx.user.level;
    const allowedCategories = (user?.allowedCategories as number[]) || [];

    const filtered = categories.filter((cat) => {
      if (ctx.user.role === "admin") return true;
      return userLevel >= cat.defaultMinLevel || allowedCategories.includes(cat.id);
    });

    return filtered;
  }),

  // 获取所有工具类型（管理员）
  listAllCategories: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(toolCategories).orderBy(asc(toolCategories.sortOrder));
  }),

  // 获取账号列表
  listAccounts: authedQuery
    .input(
      z.object({
        categoryId: z.number().optional(),
        timeSlot: z.enum(["slot_1", "slot_2", "slot_3"]).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // 获取完整用户信息
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const userLevel = user?.level || ctx.user.level;
      const allowedCategories = (user?.allowedCategories as number[]) || [];
      const blockedAccounts = (user?.blockedAccounts as number[]) || [];

      const allAccounts = await db
        .select({
          id: accounts.id,
          categoryId: accounts.categoryId,
          platform: accounts.platform,
          accountName: accounts.accountName,
          status: accounts.status,
          currentUserId: accounts.currentUserId,
          minLevelRequired: accounts.minLevelRequired,
          isActive: accounts.isActive,
          createdAt: accounts.createdAt,
        })
        .from(accounts)
        .where(eq(accounts.isActive, true));

      const filtered = allAccounts.filter((acc) => {
        if (ctx.user.role === "admin") return true;
        if (blockedAccounts.includes(acc.id)) return false;
        return userLevel >= acc.minLevelRequired || allowedCategories.includes(acc.categoryId);
      });

      if (input?.categoryId) {
        return filtered.filter((acc) => acc.categoryId === input.categoryId);
      }

      return filtered;
    }),

  // 获取账号详情
  getAccountDetail: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, input.id))
        .limit(1);

      if (!account) {
        throw new Error("账号不存在");
      }

      if (ctx.user.role !== "admin" && account.currentUserId !== ctx.user.id) {
        return {
          id: account.id,
          categoryId: account.categoryId,
          platform: account.platform,
          accountName: account.accountName,
          status: account.status,
          currentUserId: account.currentUserId,
          minLevelRequired: account.minLevelRequired,
          isActive: account.isActive,
          loginAccount: null,
          loginPassword: null,
          apiKey: null,
        };
      }

      return account;
    }),

  // 管理员：创建工具类型
  createCategory: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        icon: z.string().optional(),
        defaultMinLevel: z.number().min(1).max(5).default(1),
        sortOrder: z.number().default(0),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(toolCategories).values(input);
      return { id: Number(result.insertId) };
    }),

  // 管理员：更新工具类型
  updateCategory: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        icon: z.string().optional(),
        defaultMinLevel: z.number().min(1).max(5).optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(toolCategories).set(data).where(eq(toolCategories.id, id));
      return { success: true };
    }),

  // 管理员：创建账号
  createAccount: adminQuery
    .input(
      z.object({
        categoryId: z.number(),
        platform: z.string().min(1),
        accountName: z.string().min(1),
        loginAccount: z.string().min(1),
        loginPassword: z.string().min(1),
        apiKey: z.string().optional(),
        minLevelRequired: z.number().min(1).max(5).default(1),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(accounts).values(input);
      return { id: Number(result.insertId) };
    }),

  // 管理员：更新账号
  updateAccount: adminQuery
    .input(
      z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        platform: z.string().min(1).optional(),
        accountName: z.string().min(1).optional(),
        loginAccount: z.string().min(1).optional(),
        loginPassword: z.string().min(1).optional(),
        apiKey: z.string().optional(),
        minLevelRequired: z.number().min(1).max(5).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(accounts).set(data).where(eq(accounts.id, id));
      return { success: true };
    }),

  // 管理员：删除账号
  deleteAccount: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(accounts).where(eq(accounts.id, input.id));
      return { success: true };
    }),
});
