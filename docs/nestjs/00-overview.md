# NestJS 后端迁移项目总览

## 项目信息

- **项目名称**: Jellyfish Backend NestJS
- **版本**: 0.1.0
- **Node.js 版本**: >= 20.0
- **定位**: AI 驱动的短剧制作平台后端（NestJS 版本）

## 迁移目标

将 Python FastAPI 后端完整迁移至 NestJS + Prisma@7 + LangChain@1.x，保持原有 `backend/` 目录不变，在 `backend-nestjs/` 目录构建新实现。

## 核心特性

- 🚀 **现代化架构**: NestJS 企业级框架
- 🔒 **类型安全**: TypeScript + Prisma + Zod
- 🤖 **AI 工作流**: LangChain@1.x + LangGraph
- 🧪 **测试先行**: Vitest 全面覆盖
- 🔄 **API 兼容**: 与 Python 版本 100% 兼容

## 技术栈

| 层级     | 技术                           | 版本   |
| -------- | ------------------------------ | ------ |
| 框架     | NestJS                         | ^10.x  |
| ORM      | Prisma                         | ^7.x   |
| 验证     | Zod + nestjs-zod               | ^3.x   |
| AI 框架  | LangChain + LangGraph          | ^1.x |
| 测试     | Vitest                         | ^4.x   |
| 数据库   | SQLite / MySQL / PostgreSQL    | -      |

## 文档索引

1. [迁移计划](./01-migration-plan.md) - 详细迁移步骤
2. [技术栈选型](./02-tech-stack.md) - 技术选型说明
3. [数据库设计](./03-database-schema.md) - Prisma Schema
4. [架构对比](./04-architecture-comparison.md) - Python vs NestJS
5. [API 映射](./05-api-mapping.md) - 端点对照
6. [测试策略](./06-testing-strategy.md) - Vitest 配置
7. [迁移示例](./07-examples/) - 代码示例
8. [问题排查](./08-troubleshooting.md) - 常见问题

## 快速开始

### 1. 安装依赖

```bash
cd backend-nestjs
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件配置数据库和 API Keys
```

### 3. 数据库初始化

```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run start:dev
```

### 5. 运行测试

```bash
npm test              # 运行所有测试
npm run test:cov      # 运行测试并生成覆盖率报告
```

## 项目结构

```
backend-nestjs/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/
│   ├── prisma/
│   ├── llm/
│   ├── studio/
│   ├── film/
│   ├── script-processing/
│   ├── chains/
│   └── utils/
├── test/
├── docs/
└── package.json
```

## 开发规范

- **代码风格**: ESLint + Prettier
- **提交规范**: Conventional Commits
- **分支策略**: Git Flow
- **测试要求**: 覆盖率 > 80%

## 联系方式

如有问题，请参考 [问题排查文档](./08-troubleshooting.md) 或创建 Issue。
