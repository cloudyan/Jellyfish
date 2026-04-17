import { defineConfig, env } from "prisma/config";
import "dotenv/config";

/**
 * Prisma 7 配置文件
 *
 * 配置说明：
 * - schema: Prisma schema 文件路径
 * - migrations: 迁移文件配置
 * - datasource: 数据库连接配置，从环境变量注入
 *
 * 注意：Prisma 7 不再支持在 schema.prisma 中直接使用 env() 函数
 * 必须通过此配置文件注入数据库连接 URL
 */
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: env("DATABASE_URL"),
    },
});
