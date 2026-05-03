import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
  json,
  boolean,
  mysqlEnum,
  date,
  bigint,
} from "drizzle-orm/mysql-core";

// 用户表
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  role: mysqlEnum("role", ["admin", "member"]).notNull().default("member"),
  level: int("level").notNull().default(1),
  allowedCategories: json("allowed_categories").$type<number[]>(),
  blockedAccounts: json("blocked_accounts").$type<number[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// AI工具类型表
export const toolCategories = mysqlTable("tool_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  defaultMinLevel: int("default_min_level").notNull().default(1),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 资源账号表
export const accounts = mysqlTable("accounts", {
  id: serial("id").primaryKey(),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).notNull(),
  platform: varchar("platform", { length: 100 }).notNull(),
  accountName: varchar("account_name", { length: 100 }).notNull(),
  loginAccount: varchar("login_account", { length: 255 }).notNull(),
  loginPassword: varchar("login_password", { length: 255 }).notNull(),
  apiKey: text("api_key"),
  status: mysqlEnum("status", ["available", "occupied"]).notNull().default("available"),
  currentUserId: bigint("current_user_id", { mode: "number", unsigned: true }),
  currentReservationId: bigint("current_reservation_id", { mode: "number", unsigned: true }),
  minLevelRequired: int("min_level_required").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 预约/占用记录表
export const reservations = mysqlTable("reservations", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  accountId: bigint("account_id", { mode: "number", unsigned: true }).notNull(),
  date: date("date").notNull(),
  timeSlot: mysqlEnum("time_slot", ["slot_1", "slot_2", "slot_3"]).notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 系统设置表
export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
