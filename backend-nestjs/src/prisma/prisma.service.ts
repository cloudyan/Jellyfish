import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from "@nestjs/common";
import { PrismaClient, Prisma } from "../generated/prisma";

/**
 * Prisma 服务配置选项
 */
export interface PrismaServiceOptions {
    /** 日志配置 */
    log?: Array<"query" | "error" | "warn" | "info">;
}

/**
 * Prisma 服务
 *
 * 功能：
 * - 继承 PrismaClient，实现 NestJS 生命周期钩子
 * - 实现单例模式避免重复创建连接
 * - 提供数据库连接管理工具函数
 * - 提供事务执行工具函数
 * - 提供数据库健康检查
 */
@Injectable()
export class PrismaService
    extends PrismaClient<Prisma.PrismaClientOptions, "query" | "error" | "warn" | "info">
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(PrismaService.name);

    /**
     * 创建 PrismaService 实例
     * @param options - 可选配置
     */
    constructor(options?: PrismaServiceOptions) {
        const logConfig =
            options?.log ??
            (process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"]);

        super({
            log: logConfig,
        });
    }

    /**
     * 模块初始化时连接数据库
     */
    async onModuleInit(): Promise<void> {
        await this.connectDatabase();
    }

    /**
     * 模块销毁时断开数据库连接
     */
    async onModuleDestroy(): Promise<void> {
        await this.disconnectDatabase();
    }

    /**
     * 连接数据库
     */
    async connectDatabase(): Promise<void> {
        try {
            await this.$connect();
            this.logger.log("✅ 数据库连接成功");
        } catch (error) {
            this.logger.error(
                "❌ 数据库连接失败:",
                error instanceof Error ? error.message : String(error)
            );
            throw error;
        }
    }

    /**
     * 断开数据库连接
     */
    async disconnectDatabase(): Promise<void> {
        await this.$disconnect();
        this.logger.log("🔌 数据库连接已断开");
    }

    /**
     * 在事务中执行操作
     *
     * 使用示例：
     * ```typescript
     * await prismaService.runInTransaction(async (tx) => {
     *   const user = await tx.user.create({ data: { name: "Alice" } });
     *   await tx.post.create({ data: { authorId: user.id, title: "Hello" } });
     * });
     * ```
     *
     * @param fn - 在事务中执行的函数
     * @returns 函数返回值
     */
    async runInTransaction<T>(
        fn: (tx: Prisma.TransactionClient) => Promise<T>
    ): Promise<T> {
        return this.$transaction(fn);
    }

    /**
     * 检查数据库健康状态
     *
     * @returns 健康检查结果
     */
    async checkDatabaseHealth(): Promise<{ ok: boolean; error?: string }> {
        try {
            await this.$queryRaw`SELECT 1`;
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : "未知错误",
            };
        }
    }

    /**
     * 清理数据库（仅用于测试环境）
     *
     * ⚠️ 警告：此操作会删除所有数据，仅应在测试环境中使用
     */
    async cleanDatabase(): Promise<void> {
        if (process.env.NODE_ENV === "production") {
            throw new Error("生产环境禁止清理数据库");
        }

        // 定义需要清空的模型列表（按照外键依赖顺序）
        const models = [
            "shotDialogLine",
            "shotDetail",
            "shotExtractedCandidate",
            "shotFrameImage",
            "shot",
            "chapter",
            "characterImage",
            "character",
            "projectActorLink",
            "projectSceneLink",
            "projectPropLink",
            "projectCostumeLink",
            "actor",
            "scene",
            "prop",
            "costume",
            "assetImage",
            "fileUsage",
            "taskLink",
            "task",
            "studioPromptFilesTimeline",
            "studioTimeline",
            "promptFile",
            "promptTemplate",
            "modelSetting",
            "model",
            "provider",
            "project",
        ];

        // 使用事务清空所有表
        await this.$transaction(
            models.map((modelKey) => {
                const model = this[modelKey as keyof this] as {
                    deleteMany: () => Promise<unknown>;
                };
                return model.deleteMany();
            })
        );

        this.logger.log("🧹 数据库已清空");
    }
}

/**
 * 类型导出
 * 方便其他模块使用 Prisma 类型
 */
export type { Prisma } from "../generated/prisma";
