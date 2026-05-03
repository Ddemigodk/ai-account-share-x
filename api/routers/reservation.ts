import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { accounts, reservations, users } from "@db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const SLOT_CONFIG = {
  slot_1: { start: 9, end: 14 },
  slot_2: { start: 14, end: 18 },
  slot_3: { start: 18, end: 24 },
};

function getSlotTimes(slot: "slot_1" | "slot_2" | "slot_3", dateStr: string) {
  const config = SLOT_CONFIG[slot];
  const date = new Date(dateStr);
  const startTime = new Date(date);
  startTime.setHours(config.start, 0, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(config.end, 0, 0, 0);
  return { startTime, endTime };
}

export const reservationRouter = createRouter({
  // 创建预约（占用账号）
  create: authedQuery
    .input(
      z.object({
        accountId: z.number(),
        timeSlot: z.enum(["slot_1", "slot_2", "slot_3"]),
        date: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const { accountId, timeSlot, date } = input;

      // 1. 检查账号
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, accountId))
        .limit(1);

      if (!account || !account.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "账号不存在或已禁用" });
      }

      // 2. 检查用户权限
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }

      const userLevel = user.level;
      const allowedCategories = (user.allowedCategories as number[]) || [];
      const blockedAccounts = (user.blockedAccounts as number[]) || [];

      if (blockedAccounts.includes(accountId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "该账号已被管理员屏蔽" });
      }

      if (user.role !== "admin" && userLevel < account.minLevelRequired && !allowedCategories.includes(account.categoryId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "等级不足，无法使用该账号" });
      }

      // 3. 检查账号状态
      if (account.status === "occupied") {
        throw new TRPCError({ code: "CONFLICT", message: "该账号当前已被占用" });
      }

      // 4. 计算过期时间
      const { endTime } = getSlotTimes(timeSlot, date);
      const now = new Date();

      if (endTime <= now) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "所选时段已结束" });
      }

      // 5. 检查是否已有活跃预约
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [existingReservation] = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.userId, userId),
            eq(reservations.accountId, accountId),
            eq(reservations.status, "active"),
            gte(reservations.date, today),
          ),
        )
        .limit(1);

      if (existingReservation) {
        throw new TRPCError({ code: "CONFLICT", message: "您已预约了该账号" });
      }

      // 6. 创建预约并更新账号状态
      try {
        await db
          .update(accounts)
          .set({
            status: "occupied",
            currentUserId: userId,
          })
          .where(eq(accounts.id, accountId));

        const [updatedAccount] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, accountId))
          .limit(1);

        if (updatedAccount.currentUserId !== userId) {
          throw new TRPCError({ code: "CONFLICT", message: "该账号刚被其他人占用了" });
        }

        const [reservationResult] = await db.insert(reservations).values({
          userId: userId,
          accountId: accountId,
          date: new Date(date),
          timeSlot,
          expiresAt: endTime,
        });

        const reservationId = Number(reservationResult.insertId);

        await db
          .update(accounts)
          .set({ currentReservationId: reservationId })
          .where(eq(accounts.id, accountId));

        return {
          success: true,
          reservationId,
          expiresAt: endTime,
        };
      } catch (error) {
        await db
          .update(accounts)
          .set({
            status: "available",
            currentUserId: null,
            currentReservationId: null,
          })
          .where(eq(accounts.id, accountId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "预约失败，请重试",
        });
      }
    }),

  // 取消预约/提前释放
  cancel: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [reservation] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, input.id))
        .limit(1);

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "预约记录不存在" });
      }

      if (ctx.user.role !== "admin" && reservation.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
      }

      if (reservation.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "该预约已结束或已取消" });
      }

      await db
        .update(accounts)
        .set({
          status: "available",
          currentUserId: null,
          currentReservationId: null,
        })
        .where(eq(accounts.id, reservation.accountId));

      await db
        .update(reservations)
        .set({ status: "cancelled" })
        .where(eq(reservations.id, input.id));

      return { success: true };
    }),

  // 获取当前用户的活跃预约
  myReservations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myReservations = await db
      .select({
        id: reservations.id,
        accountId: reservations.accountId,
        date: reservations.date,
        timeSlot: reservations.timeSlot,
        status: reservations.status,
        expiresAt: reservations.expiresAt,
        startedAt: reservations.startedAt,
        platform: accounts.platform,
        accountName: accounts.accountName,
      })
      .from(reservations)
      .innerJoin(accounts, eq(reservations.accountId, accounts.id))
      .where(
        and(
          eq(reservations.userId, ctx.user.id),
          eq(reservations.status, "active"),
        ),
      )
      .orderBy(desc(reservations.createdAt));

    return myReservations;
  }),

  // 获取今日所有预约
  todayReservations: authedQuery.query(async () => {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        id: reservations.id,
        userId: reservations.userId,
        accountId: reservations.accountId,
        date: reservations.date,
        timeSlot: reservations.timeSlot,
        status: reservations.status,
        expiresAt: reservations.expiresAt,
        platform: accounts.platform,
        accountName: accounts.accountName,
        displayName: users.displayName,
      })
      .from(reservations)
      .innerJoin(accounts, eq(reservations.accountId, accounts.id))
      .innerJoin(users, eq(reservations.userId, users.id))
      .where(
        and(
          gte(reservations.date, today),
          eq(reservations.status, "active"),
        ),
      )
      .orderBy(desc(reservations.createdAt));

    return result;
  }),

  // 管理员：强制释放
  forceRelease: adminQuery
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const [activeReservation] = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.accountId, input.accountId),
            eq(reservations.status, "active"),
          ),
        )
        .limit(1);

      if (activeReservation) {
        await db
          .update(reservations)
          .set({ status: "expired" })
          .where(eq(reservations.id, activeReservation.id));
      }

      await db
        .update(accounts)
        .set({
          status: "available",
          currentUserId: null,
          currentReservationId: null,
        })
        .where(eq(accounts.id, input.accountId));

      return { success: true };
    }),
});
