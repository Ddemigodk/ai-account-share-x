import { getDb } from "../api/queries/connection";
import { users, toolCategories, accounts } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // 创建管理员账号
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const [adminResult] = await db.insert(users).values({
    username: "admin",
    passwordHash: adminPasswordHash,
    displayName: "管理员",
    role: "admin",
    level: 5,
    allowedCategories: [],
  });
  console.log("Created admin user:", adminResult.insertId);

  // 创建示例成员
  const memberPasswordHash = await bcrypt.hash("member123", 10);
  for (let i = 1; i <= 5; i++) {
    const [result] = await db.insert(users).values({
      username: `member${i}`,
      passwordHash: memberPasswordHash,
      displayName: `成员${i}`,
      role: "member",
      level: i > 3 ? 3 : i,
      allowedCategories: [],
    });
    console.log(`Created member${i}:`, result.insertId);
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
    const [result] = await db.insert(toolCategories).values(cat);
    categoryIds.push(Number(result.insertId));
    console.log(`Created category ${cat.name}:`, result.insertId);
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
    const [result] = await db.insert(accounts).values(acc);
    console.log(`Created account ${acc.accountName}:`, result.insertId);
  }

  console.log("Seeding complete!");
  console.log("");
  console.log("=== 默认登录账号 ===");
  console.log("管理员: admin / admin123");
  console.log("成员: member1~member5 / member123");
  process.exit(0);
}

seed();
