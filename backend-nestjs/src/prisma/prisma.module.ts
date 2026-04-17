import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/**
 * Prisma 模块
 *
 * 功能：
 * - 全局提供 PrismaService，用于数据库操作
 * - 基于 Prisma 7 配置，使用自定义输出路径的生成客户端
 *
 * 使用说明：
 * - 在其他模块中直接注入 PrismaService 即可使用数据库操作
 * - 生成的客户端位于 src/generated/prisma
 *
 * 相关命令：
 * - pnpm db:generate - 生成 Prisma Client
 * - pnpm db:migrate - 运行数据库迁移
 * - pnpm db:studio - 打开 Prisma Studio
 */
@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule {}
