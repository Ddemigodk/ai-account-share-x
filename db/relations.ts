import { relations } from "drizzle-orm";
import { users, toolCategories, accounts, reservations } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
}));

export const toolCategoriesRelations = relations(toolCategories, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  category: one(toolCategories, {
    fields: [accounts.categoryId],
    references: [toolCategories.id],
  }),
  reservations: many(reservations),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [reservations.accountId],
    references: [accounts.id],
  }),
}));
