import {
  sqliteTable,
  integer,
  text,
  blob,
} from "drizzle-orm/sqlite-core";

// 用户表
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  username: text("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash", { length: 255 }).notNull(),
  displayName: text("display_name", { length: 100 }).notNull(),
  role: text("role", { length: 20 }).notNull().default("member"),
  level: integer("level", { mode: "number" }).notNull().default(1),
  allowedCategories: text("allowed_categories", { mode: "json" }).$type<number[]>(),
  blockedAccounts: text("blocked_accounts", { mode: "json" }).$type<number[]>(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// AI工具类型表
export const toolCategories = sqliteTable("tool_categories", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { length: 100 }).notNull(),
  icon: text("icon", { length: 50 }),
  defaultMinLevel: integer("default_min_level", { mode: "number" }).notNull().default(1),
  sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// 资源账号表
export const accounts = sqliteTable("accounts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id", { mode: "number" }).notNull(),
  platform: text("platform", { length: 100 }).notNull(),
  accountName: text("account_name", { length: 100 }).notNull(),
  loginAccount: text("login_account", { length: 255 }).notNull(),
  loginPassword: text("login_password", { length: 255 }).notNull(),
  apiKey: text("api_key"),
  status: text("status", { length: 20 }).notNull().default("available"),
  currentUserId: integer("current_user_id", { mode: "number" }),
  currentReservationId: integer("current_reservation_id", { mode: "number" }),
  minLevelRequired: integer("min_level_required", { mode: "number" }).notNull().default(1),
  sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// 预约记录表
export const reservations = sqliteTable("reservations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id", { mode: "number" }).notNull(),
  accountId: integer("account_id", { mode: "number" }).notNull(),
  period: text("period", { length: 20 }).notNull(),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  status: text("status", { length: 20 }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// 时段配置表
export const periodConfigs = sqliteTable("period_configs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { length: 50 }).notNull(),
  startTime: text("start_time", { length: 10 }).notNull(),
  endTime: text("end_time", { length: 10 }).notNull(),
  sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// 系统设置表
export const settings = sqliteTable("settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
