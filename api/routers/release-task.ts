import { getDb } from "../queries/connection";
import { accounts, reservations } from "@db/schema";
import { eq, and, lte } from "drizzle-orm";

let isRunning = false;

export async function releaseExpiredReservations() {
  if (isRunning) return;
  isRunning = true;

  try {
    const db = getDb();
    const now = new Date();

    // 找到所有过期的活跃预约
    const expiredReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.status, "active"),
          lte(reservations.endTime, now),
        ),
      );

    for (const reservation of expiredReservations) {
      // 释放账号
      await db
        .update(accounts)
        .set({
          status: "available",
          currentUserId: null,
          currentReservationId: null,
        })
        .where(eq(accounts.id, reservation.accountId));

      // 更新预约状态
      await db
        .update(reservations)
        .set({ status: "expired" })
        .where(eq(reservations.id, reservation.id));
    }

    if (expiredReservations.length > 0) {
      console.log(`[${new Date().toISOString()}] Released ${expiredReservations.length} expired reservations`);
    }
  } catch (error) {
    console.error("Error releasing expired reservations:", error);
  } finally {
    isRunning = false;
  }
}

export function startReleaseTask() {
  // 立即执行一次
  releaseExpiredReservations();
  // 每60秒执行一次
  const interval = setInterval(releaseExpiredReservations, 60000);
  return interval;
}
