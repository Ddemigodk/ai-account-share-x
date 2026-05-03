import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routers/auth";
import { resourceRouter } from "./routers/resource";
import { reservationRouter } from "./routers/reservation";
import { adminRouter } from "./routers/admin";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  resource: resourceRouter,
  reservation: reservationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
