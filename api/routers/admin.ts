import { z } from "zod";
import bcrypt from "bcryptjs";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, accounts, reservations, toolCategories } from "@db/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";

export const adminRouter = createRouter({
  // 仪表盘统计
  dashboard: adminQuery.query(async () => {
    const db = getDb();

    const [memberCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const [accountCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(eq(accounts.isActive, true));

    const [occupiedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(and(eq(accounts.isActive, true), eq(accounts.status, "occupied")));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayReservationCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(
        and(
          gte(reservations.date, today),
          eq(reservations.status, "active"),
        ),
      );

    return {
      totalMembers: memberCount.count,
      totalAccounts: accountCount.count,
      occupiedAccounts: occupiedCount.count,
      todayReservations: todayReservationCount.count,
    };
  }),

  // 成员列表
  listMembers: adminQuery.query(async () => {
    const db = getDb();
    const allMembers = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        role: users.role,
        level: users.level,
        allowedCategories: users.allowedCategories,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const membersWithCount = await Promise.all(
      allMembers.map(async (member) => {
        const [count] = await db
          .select({ count: sql<number>`count(*)` })
          .from(reservations)
          .where(
            and(
              eq(reservations.userId, member.id),
              eq(reservations.status, "active"),
            ),
          );
        return {
          ...member,
          activeReservations: count.count,
        };
      }),
    );

    return membersWithCount;
  }),

  // 创建成员
  createMember: adminQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(6),
        displayName: z.string().min(1),
        role: z.enum(["admin", "member"]).default("member"),
        level: z.number().min(1).max(5).default(1),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const passwordHash = await bcrypt.hash(input.password, 10);

      const [result] = await db.insert(users).values({
        username: input.username,
        passwordHash,
        displayName: input.displayName,
        role: input.role,
        level: input.level,
      });

      return { id: Number(result.insertId) };
    }),

  // 更新成员
  updateMember: adminQuery
    .input(
      z.object({
        id: z.number(),
        displayName: z.string().min(1).optional(),
        role: z.enum(["admin", "member"]).optional(),
        level: z.number().min(1).max(5).optional(),
        allowedCategories: z.array(z.number()).optional(),
        blockedAccounts: z.array(z.number()).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      if (Object.keys(data).length === 0) {
        return { success: true };
      }

      await db.update(users).set(data).where(eq(users.id, id));
      return { success: true };
    }),

  // 重置密码
  resetPassword: adminQuery
    .input(
      z.object({
        id: z.number(),
        newPassword: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, input.id));
      return { success: true };
    }),

  // 获取所有预约记录
  listReservations: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }).optional(),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      const result = await db
        .select({
          id: reservations.id,
          userId: reservations.userId,
          accountId: reservations.accountId,
          date: reservations.date,
          timeSlot: reservations.timeSlot,
          status: reservations.status,
          expiresAt: reservations.expiresAt,
          startedAt: reservations.startedAt,
          displayName: users.displayName,
          platform: accounts.platform,
          accountName: accounts.accountName,
        })
        .from(reservations)
        .innerJoin(users, eq(reservations.userId, users.id))
        .innerJoin(accounts, eq(reservations.accountId, accounts.id))
        .orderBy(desc(reservations.createdAt))
        .limit(pageSize)
        .offset(offset);

      return result;
    }),

  // 账号利用率统计
  accountStats: adminQuery.query(async () => {
    const db = getDb();

    const stats = await db
      .select({
        categoryId: accounts.categoryId,
        categoryName: toolCategories.name,
        total: sql<number>`count(*)`,
        occupied: sql<number>`sum(case when ${accounts.status} = 'occupied' then 1 else 0 end)`,
      })
      .from(accounts)
      .innerJoin(toolCategories, eq(accounts.categoryId, toolCategories.id))
      .where(eq(accounts.isActive, true))
      .groupBy(accounts.categoryId, toolCategories.name);

    return stats;
  }),
});
