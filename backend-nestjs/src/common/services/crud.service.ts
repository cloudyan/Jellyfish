import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * CRUD 基础服务
 * 为所有实体提供通用的 CRUD 操作
 * 类似于 Python 版本中的 CRUD 基类
 */
@Injectable()
export class CrudService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * 获取实体的 Prisma 委托
     */
    private getDelegate<T extends keyof PrismaService>(modelName: T): PrismaService[T] {
        const delegate = this.prisma[modelName];
        if (!delegate) {
            throw new Error(`Model ${String(modelName)} not found in PrismaClient`);
        }
        return delegate;
    }

    /**
     * 获取单条记录
     */
    async get<T extends keyof PrismaService>(
        modelName: T,
        id: number | string,
        options: {
            include?: Record<string, boolean>;
            select?: Record<string, boolean>;
        } = {},
    ): Promise<unknown> {
        const delegate = this.getDelegate(modelName) as {
            findUnique: (args: { where: { id: number | string }; include?: unknown; select?: unknown }) => Promise<unknown>;
        };

        const result = await delegate.findUnique({
            where: { id },
            ...(options.include && { include: options.include }),
            ...(options.select && { select: options.select }),
        });

        if (!result) {
            throw new NotFoundException(`${String(modelName)} with id ${id} not found`);
        }

        return result;
    }

    /**
     * 获取多条记录
     */
    async getMulti<T extends keyof PrismaService>(
        modelName: T,
        options: {
            skip?: number;
            take?: number;
            where?: Record<string, unknown>;
            orderBy?: Record<string, 'asc' | 'desc'>;
            include?: Record<string, boolean>;
            select?: Record<string, boolean>;
        } = {},
    ): Promise<unknown[]> {
        const delegate = this.getDelegate(modelName) as {
            findMany: (args: {
                skip?: number;
                take?: number;
                where?: unknown;
                orderBy?: unknown;
                include?: unknown;
                select?: unknown;
            }) => Promise<unknown[]>;
        };

        return delegate.findMany({
            skip: options.skip ?? 0,
            take: options.take ?? 100,
            where: options.where,
            orderBy: options.orderBy,
            ...(options.include && { include: options.include }),
            ...(options.select && { select: options.select }),
        });
    }

    /**
     * 创建记录
     */
    async create<T extends keyof PrismaService>(
        modelName: T,
        data: Record<string, unknown>,
        options: {
            include?: Record<string, boolean>;
            select?: Record<string, boolean>;
        } = {},
    ): Promise<unknown> {
        const delegate = this.getDelegate(modelName) as {
            create: (args: { data: unknown; include?: unknown; select?: unknown }) => Promise<unknown>;
        };

        return delegate.create({
            data,
            ...(options.include && { include: options.include }),
            ...(options.select && { select: options.select }),
        });
    }

    /**
     * 更新记录
     */
    async update<T extends keyof PrismaService>(
        modelName: T,
        id: number | string,
        data: Record<string, unknown>,
        options: {
            include?: Record<string, boolean>;
            select?: Record<string, boolean>;
        } = {},
    ): Promise<unknown> {
        const delegate = this.getDelegate(modelName) as {
            update: (args: { where: { id: number | string }; data: unknown; include?: unknown; select?: unknown }) => Promise<unknown>;
        };

        // 先检查记录是否存在
        await this.get(modelName, id);

        return delegate.update({
            where: { id },
            data,
            ...(options.include && { include: options.include }),
            ...(options.select && { select: options.select }),
        });
    }

    /**
     * 删除记录
     */
    async delete<T extends keyof PrismaService>(
        modelName: T,
        id: number | string,
    ): Promise<unknown> {
        const delegate = this.getDelegate(modelName) as {
            delete: (args: { where: { id: number | string } }) => Promise<unknown>;
        };

        // 先检查记录是否存在
        await this.get(modelName, id);

        return delegate.delete({
            where: { id },
        });
    }

    /**
     * 检查记录是否存在
     */
    async exists<T extends keyof PrismaService>(
        modelName: T,
        where: Record<string, unknown>,
    ): Promise<boolean> {
        const delegate = this.getDelegate(modelName) as {
            count: (args: { where: unknown }) => Promise<number>;
        };

        const count = await delegate.count({ where });
        return count > 0;
    }

    /**
     * 统计记录数
     */
    async count<T extends keyof PrismaService>(
        modelName: T,
        where?: Record<string, unknown>,
    ): Promise<number> {
        const delegate = this.getDelegate(modelName) as {
            count: (args: { where?: unknown }) => Promise<number>;
        };

        return delegate.count({ where });
    }
}
