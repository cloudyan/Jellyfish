# 技术栈选型说明

## 选型原则

在 NestJS 迁移项目中，技术栈的选择遵循以下原则：

1. **类型安全优先**: TypeScript 全链路类型检查
2. **生态成熟度**: 选择社区活跃、文档完善的方案
3. **性能考量**: 响应速度、内存占用、并发能力
4. **迁移友好度**: 与 Python 版本概念对齐，降低学习成本

## 核心依赖栈

### 1. 框架层

#### NestJS ^10.x

**选型理由**:
- 企业级 Node.js 框架，架构清晰
- 原生支持 TypeScript，装饰器模式与 Python FastAPI 类似
- 完善的依赖注入容器
- 模块化设计，易于测试和维护
- 生态丰富（Swagger、Validation、Config 等官方支持）

**替代方案对比**:
| 框架 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Express | 简单灵活 | 缺乏架构规范 | ❌ 放弃 |
| Fastify | 性能更好 | 学习成本略高 | ⚠️ 备选 |
| NestJS | 架构完善 | 有一定学习曲线 | ✅ 选定 |

### 2. ORM 层

#### Prisma 7.x

**选型理由**:
- 类型安全最佳，自动生成 TypeScript 类型
- 声明式 Schema 定义，易于版本控制
- 迁移系统成熟，支持回滚
- VS Code 插件支持，开发体验优秀
- Prisma 7 性能大幅提升

**关键特性**:
```typescript
// Prisma Client 使用示例
const shots = await prisma.shot.findMany({
  where: { chapterId: 1 },
  include: {
    dialogLines: true,
    frameImages: true
  }
});
```

**替代方案对比**:
| ORM | 优点 | 缺点 | 结论 |
|-----|------|------|------|
| TypeORM | 功能丰富 | 维护放缓，类型不够严格 | ❌ 放弃 |
| Sequelize | 成熟稳定 | 类型支持一般 | ❌ 放弃 |
| Drizzle | 轻量高性能 | 生态尚不成熟 | ⚠️ 备选 |
| Prisma | 类型安全 | 复杂查询性能 | ✅ 选定 |

### 3. 验证层

#### Zod ^3.x + nestjs-zod

**选型理由**:
- 运行时类型验证与 TypeScript 类型推导无缝结合
- 清晰的错误信息
- 支持复杂类型变换和默认值
- nestjs-zod 提供与 NestJS 管道集成

**使用示例**:
```typescript
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const CreateShotSchema = z.object({
  chapterId: z.number().int().positive(),
  shotNumber: z.string().min(1),
  content: z.string().optional(),
});

export class CreateShotDto extends createZodDto(CreateShotSchema) {}
export type CreateShotType = z.infer<typeof CreateShotSchema>;
```

**替代方案对比**:
| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| class-validator | NestJS 原生支持 | 装饰器冗长，类型重复定义 | ❌ 放弃 |
| Joi | 功能强大 | 无 TypeScript 推导 | ❌ 放弃 |
| Yup | 简洁易用 | 类型支持不如 Zod | ⚠️ 备选 |
| Zod | 类型推导完美 | 生态略新 | ✅ 选定 |

### 4. AI 框架层

#### LangChain ^1.x + LangGraph

**选型理由**:
- JS 版本与 Python 版本 API 设计保持一致
- 生态完整，支持所有主流 LLM Provider
- LangGraph 提供工作流编排能力
- 活跃的社区和快速迭代

**关键包依赖**:
```json
{
  "@langchain/core": "^1.x",
  "@langchain/openai": "^1.x",
  "@langchain/anthropic": "^1.x",
  "@langchain/langgraph": "^1.x"
}
```

**Agent 开发模式**:
```typescript
// LangChain Agent 示例
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";

const model = new ChatOpenAI({ modelName: "gpt-4" });

const chain = RunnableSequence.from([
  promptTemplate,
  model,
  outputParser
]);
```

### 5. 测试框架

#### Vitest ^2.x

**选型理由**:
- 与 Vite 生态一致，配置简单
- 原生 TypeScript 支持，无需 ts-node
- 与 Jest API 兼容，迁移成本低
- 更快的测试执行速度

**配置示例**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
```

**替代方案对比**:
| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Jest | 生态最成熟 | 配置复杂，ts-node 依赖 | ⚠️ 备选 |
| Mocha | 灵活 | 配置工作量大 | ❌ 放弃 |
| Vitest | 快速简洁 | 相对较新 | ✅ 选定 |

### 6. 数据库

#### SQLite（开发）/ PostgreSQL（生产）

**选型理由**:
- SQLite: 零配置，适合本地开发和测试
- PostgreSQL: 生产级数据库，支持复杂查询和并发
- Prisma 同时支持两者，切换成本低

## 依赖版本锁定

### package.json 核心依赖

```json
{
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/swagger": "^8.0.0",
    "@nestjs/config": "^3.3.0",
    "@prisma/client": "^7.0.0",
    "@langchain/core": "^1.x",
    "@langchain/openai": "^1.x",
    "@langchain/langgraph": "^1.x",
    "zod": "^3.23.0",
    "nestjs-zod": "^4.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.0",
    "@nestjs/testing": "^10.4.0",
    "@types/node": "^20.0.0",
    "prisma": "^7.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0"
  }
}
```

## 版本升级策略

### 主要依赖升级周期

| 依赖 | 当前版本 | 升级策略 | 注意事项 |
|------|----------|----------|----------|
| NestJS | ^10.x | 跟随主版本 | 关注 breaking changes |
| Prisma | ^7.x | 跟随主版本 | 迁移脚本需测试 |
| LangChain | ^1.x | 跟随主版本 | 关注 breaking changes |
| Zod | ^3.x | 自动升级 | 相对稳定 |

### 安全更新

启用 Dependabot 自动检查安全更新：

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend-nestjs"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

## 开发环境要求

### Node.js 版本

- **最低版本**: Node.js 20.0.0
- **推荐版本**: Node.js 20.x LTS 或 22.x LTS
- **包管理器**: npm 10+ 或 pnpm 9+

### 环境变量

```bash
# 必需
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-..."

# 可选
ANTHROPIC_API_KEY="sk-ant-..."
LOG_LEVEL="debug"
```

## 与 Python 版本的差异

| 方面 | Python FastAPI | NestJS | 影响 |
|------|----------------|--------|------|
| 类型系统 | Pydantic | Zod + TS | 概念相似，语法不同 |
| ORM | SQLAlchemy | Prisma | 查询风格差异 |
| 依赖注入 | 函数参数 | 构造函数 | 模式不同，理念一致 |
| AI 框架 | LangChain Python | LangChain JS | API 基本一致 |
| 异步模型 | async/await | async/await | 完全相同 |

## 参考资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Zod 文档](https://zod.dev/)
- [LangChain JS 文档](https://js.langchain.com/)
- [Vitest 文档](https://vitest.dev/)
