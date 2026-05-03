import { db } from "../api/queries/connection";
import { users, toolCategories, accounts, periodConfigs, settings } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // 清空现有数据
  await db.delete(accounts);
  await db.delete(toolCategories);
  await db.delete(users);
  await db.delete(periodConfigs);
  await db.delete(settings);

  // 创建管理员账号
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const adminResult = await db.insert(users).values({
    username: "admin",
    passwordHash: adminPasswordHash,
    displayName: "管理员",
    role: "admin",
    level: 5,
    allowedCategories: [],
  }).returning();
  console.log("Created admin user:", adminResult[0].id);

  // 创建示例成员
  const memberPasswordHash = await bcrypt.hash("member123", 10);
  for (let i = 1; i <= 5; i++) {
    const result = await db.insert(users).values({
      username: `member${i}`,
      passwordHash: memberPasswordHash,
      displayName: `成员${i}`,
      role: "member",
      level: i > 3 ? 3 : i,
      allowedCategories: [],
    }).returning();
    console.log(`Created member${i}:`, result[0].id);
  }

  // 创建工具类型
  const categories = [
    { name: "AI对话", icon: "MessageSquare", defaultMinLevel: 1, sortOrder: 1 },
    { name: "AI写作", icon: "PenTool", defaultMinLevel: 2, sortOrder: 2 },
    { name: "AI绘画", icon: "Palette", defaultMinLevel: 3, sortOrder: 3 },
    { name: "AI编程", icon: "Code2", defaultMinLevel: 4, sortOrder: 4 },
    { name: "AI视频", icon: "Video", defaultMinLevel: 4, sortOrder: 5 },
  ];

  const categoryIds: number[] = [];
  for (const cat of categories) {
    const result = await db.insert(toolCategories).values(cat).returning();
    categoryIds.push(result[0].id);
    console.log(`Created category ${cat.name}:`, result[0].id);
  }

  // 创建示例账号
  const accountData = [
    { categoryId: categoryIds[0], platform: "ChatGPT", accountName: "GPT-Team-01", loginAccount: "team01@example.com", loginPassword: "gpt_pass_01", minLevelRequired: 1 },
    { categoryId: categoryIds[0], platform: "ChatGPT", accountName: "GPT-Team-02", loginAccount: "team02@example.com", loginPassword: "gpt_pass_02", minLevelRequired: 1 },
    { categoryId: categoryIds[0], platform: "Claude", accountName: "Claude-Pro-01", loginAccount: "claude01@example.com", loginPassword: "claude_pass_01", minLevelRequired: 2 },
    { categoryId: categoryIds[1], platform: "Jasper", accountName: "Jasper-01", loginAccount: "jasper01@example.com", loginPassword: "jasper_pass_01", minLevelRequired: 2 },
    { categoryId: categoryIds[2], platform: "Midjourney", accountName: "MJ-Biz-01", loginAccount: "mj01@example.com", loginPassword: "mj_pass_01", minLevelRequired: 3 },
    { categoryId: categoryIds[2], platform: "Midjourney", accountName: "MJ-Biz-02", loginAccount: "mj02@example.com", loginPassword: "mj_pass_02", minLevelRequired: 3 },
    { categoryId: categoryIds[3], platform: "GitHub Copilot", accountName: "Copilot-01", loginAccount: "copilot01@example.com", loginPassword: "copilot_pass_01", minLevelRequired: 4 },
    { categoryId: categoryIds[4], platform: "Runway", accountName: "Runway-01", loginAccount: "runway01@example.com", loginPassword: "runway_pass_01", minLevelRequired: 4 },
  ];

  for (const acc of accountData) {
    const result = await db.insert(accounts).values(acc).returning();
    console.log(`Created account ${acc.accountName}:`, result[0].id);
  }

  // 创建时段配置
  const periods = [
    { name: "上午场", startTime: "09:00", endTime: "14:00", sortOrder: 1 },
    { name: "下午场", startTime: "14:00", endTime: "18:00", sortOrder: 2 },
    { name: "晚场", startTime: "18:00", endTime: "24:00", sortOrder: 3 },
  ];
  for (const p of periods) {
    await db.insert(periodConfigs).values(p);
    console.log(`Created period ${p.name}`);
  }

  // 系统设置
  await db.insert(settings).values([
    { key: "site_name", value: "AI账号共享系统" },
    { key: "release_interval", value: "60" },
  ]);
  console.log("Created settings");

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
