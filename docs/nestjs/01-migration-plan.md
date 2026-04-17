---
status: not-started
phase: 0
updated: 2026-04-08
---

# NestJS 后端迁移计划

## Goal
将 Python FastAPI 后端完整迁移至 NestJS + Prisma@7 + LangChain@1.x，采用测试先行策略，保持原有 backend 目录不变，在 backend-nestjs 目录构建新实现。

## Context & Decisions

| Decision | Rationale | Source |
|----------|-----------|--------|
| ORM 选择 Prisma@7 | 最新版本，性能更好，类型安全最佳，迁移自动化 | 架构分析 |
| 测试先行策略 | TDD 最佳实践，确保行为一致性，测试即需求文档 | 最佳实践 |
| 保持 Python 后端不变 | 渐进式迁移，降低风险，便于回滚和对比测试 | 架构评估 |
| 使用 LangChain@1.x JS | 与 Python 版本 API 设计一致，生态成熟 | 架构分析 |
| NestJS 框架 | 企业级架构、依赖注入完善、TypeScript 原生 | 技术选型分析 |

## Phase 0: 测试基线建立 [PENDING]

### 0.1 Python 后端测试完善
- [ ] 0.1.1 评估当前测试覆盖率
- [ ] 0.1.2 补充缺失的 E2E 测试用例
- [ ] 0.1.3 确保所有 API 端点有测试覆盖
- [ ] 0.1.4 记录边界条件和异常情况

### 0.2 API 契约文档生成
- [ ] 0.2.1 导出 Python 后端 OpenAPI Spec
- [ ] 0.2.2 整理所有 API 的请求/响应示例
- [ ] 0.2.3 记录 Agent 工作流的输入输出示例
- [ ] 0.2.4 建立 API 兼容性检查清单

### 0.3 测试数据准备
- [ ] 0.3.1 导出测试数据库种子数据
- [ ] 0.3.2 准备典型剧本处理测试用例
- [ ] 0.3.3 建立测试数据集版本控制

## Phase 1: 项目初始化与环境搭建 [PENDING]

### 1.1 NestJS 项目脚手架搭建
- [ ] 1.1.1 使用 Nest CLI 创建项目：`nest new backend-nestjs`
- [ ] 1.1.2 配置 TypeScript 严格模式
- [ ] 1.1.3 配置 ESLint + Prettier 代码规范
- [ ] 1.1.4 配置路径别名和模块解析

### 1.2 Prisma@7 集成配置
- [ ] 1.2.1 安装 Prisma CLI 和 Client：`npm install prisma@7 @prisma/client@7`
- [ ] 1.2.2 初始化 Prisma：`npx prisma init`
- [ ] 1.2.3 配置数据库连接（支持 SQLite/MySQL/PostgreSQL）
- [ ] 1.2.4 安装 NestJS Prisma 模块

### 1.3 LangChain 生态集成
- [ ] 1.3.1 安装 LangChain Core：`npm install @langchain/core`
- [ ] 1.3.2 安装 LangChain OpenAI/Anthropic 等 Provider
- [ ] 1.3.3 安装 LangGraph：`npm install @langchain/langgraph`
- [ ] 1.3.4 配置环境变量管理

### 1.4 基础设施配置
- [ ] 1.4.1 配置日志系统
- [ ] 1.4.2 配置 Swagger/OpenAPI 文档
- [ ] 1.4.3 配置全局异常过滤器
- [ ] 1.4.4 配置请求/响应拦截器
- [ ] 1.4.5 配置健康检查端点

## Phase 2: 数据模型层迁移 (Prisma Schema) [PENDING]

### 2.1 基础模型迁移
- [ ] 2.1.1 迁移时间戳混入模型
- [ ] 2.1.2 迁移枚举类型
- [ ] 2.1.3 配置 Prisma 生成 TypeScript 类型

### 2.2 LLM 管理模型（4 张表）
- [ ] 2.2.1 Provider 模型
- [ ] 2.2.2 Model 模型
- [ ] 2.2.3 ModelSetting 模型
- [ ] 2.2.4 验证关系和外键约束

### 2.3 Studio 核心模型（15+ 张表）
- [ ] 2.3.1 Project / Chapter / Shot 层级模型
- [ ] 2.3.2 ShotDetail / ShotDialogLine / ShotFrameImage 详情模型
- [ ] 2.3.3 Character / Actor / Scene / Prop / Costume 资产模型
- [ ] 2.3.4 关联表
- [ ] 2.3.5 AssetImage / FileUsage 文件相关模型

### 2.4 任务与模板模型
- [ ] 2.4.1 Task / TaskLink 任务模型
- [ ] 2.4.2 PromptTemplate 提示词模板
- [ ] 2.4.3 Timeline / File 相关模型

### 2.5 数据库迁移执行
- [ ] 2.5.1 生成 Prisma Migration
- [ ] 2.5.2 创建数据迁移脚本
- [ ] 2.5.3 验证数据库 Schema 完整性
- [ ] 2.5.4 配置 Prisma Seed 数据

## Phase 3: 核心服务层实现 [PENDING]

### 3.1 通用服务模块（CommonModule）
- [ ] 3.1.1 CRUD 通用服务封装
- [ ] 3.1.2 错误处理服务
- [ ] 3.1.3 校验工具服务
- [ ] 3.1.4 统一响应结构

### 3.2 LLM 管理服务（LLMModule）
- [ ] 3.2.1 Provider 管理服务
- [ ] 3.2.2 Model 管理服务
- [ ] 3.2.3 Model Resolver 服务
- [ ] 3.2.4 LLM 实例工厂服务

### 3.3 Studio 业务服务（StudioModule）
- [ ] 3.3.1 Project 服务
- [ ] 3.3.2 Chapter 服务
- [ ] 3.3.3 Shot 服务
- [ ] 3.3.4 Entity 服务
- [ ] 3.3.5 Image Task 服务

### 3.4 Film 影视技能服务（FilmModule）
- [ ] 3.4.1 Generated Video 服务
- [ ] 3.4.2 Shot Frame Prompt Tasks 服务
- [ ] 3.4.3 图片/视频生成集成服务

## Phase 4: LangChain Agent 工作流迁移 [PENDING]

### 4.1 Agent 基础架构
- [ ] 4.1.1 Agent 基类设计
- [ ] 4.1.2 PromptTemplate 管理
- [ ] 4.1.3 JSON 解析与修复工具
- [ ] 4.1.4 结构化输出适配器

### 4.2 脚本处理 Agent（8 个核心 Agent）
- [ ] 4.2.1 ScriptDividerAgent
- [ ] 4.2.2 ElementExtractorAgent
- [ ] 4.2.3 EntityMergerAgent
- [ ] 4.2.4 VariantAnalyzerAgent
- [ ] 4.2.5 ConsistencyCheckerAgent
- [ ] 4.2.6 ScriptOptimizerAgent

### 4.3 分析类 Agent（4 个）
- [ ] 4.3.1 CharacterPortraitAnalysisAgent
- [ ] 4.3.2 SceneInfoAnalysisAgent
- [ ] 4.3.3 CostumeInfoAnalysisAgent
- [ ] 4.3.4 PropInfoAnalysisAgent

### 4.4 LangGraph 工作流编排
- [ ] 4.4.1 迁移工作流图定义
- [ ] 4.4.2 实现完整处理 Pipeline
- [ ] 4.4.3 状态管理机制适配
- [ ] 4.4.4 条件分支和循环处理

## Phase 5: API 路由层实现 [PENDING]

### 5.1 健康检查与基础端点
- [ ] 5.1.1 GET /health
- [ ] 5.1.2 API 版本前缀配置

### 5.2 LLM 管理端点
- [ ] 5.2.1 /llm/providers
- [ ] 5.2.2 /llm/models
- [ ] 5.2.3 /llm/settings

### 5.3 Studio 端点
- [ ] 5.3.1 /studio/projects/*
- [ ] 5.3.2 /studio/chapters/*
- [ ] 5.3.3 /studio/shots/*
- [ ] 5.3.4 /studio/entities/*
- [ ] 5.3.5 /studio/files/*
- [ ] 5.3.6 /studio/image-tasks/*
- [ ] 5.3.7 /studio/timeline/*

### 5.4 脚本处理端点
- [ ] 5.4.1 POST /script-processing/divide
- [ ] 5.4.2 POST /script-processing/merge-entities
- [ ] 5.4.3 POST /script-processing/analyze-variants
- [ ] 5.4.4 POST /script-processing/check-consistency
- [ ] 5.4.5 POST /script-processing/extract
- [ ] 5.4.6 POST /script-processing/full-process
- [ ] 5.4.7 独立分析端点
- [ ] 5.4.8 POST /script-processing/simplify-script

### 5.5 Film 端点
- [ ] 5.5.1 /film/*

## Phase 6: Schema/DTO 定义 [PENDING]

### 6.1 通用 Schema
- [ ] 6.1.1 ApiResponse 统一响应结构
- [ ] 6.1.2 Pagination 分页结构
- [ ] 6.1.3 Error Response 错误响应

### 6.2 LLM Schema
- [ ] 6.2.1 Provider CRUD DTOs
- [ ] 6.2.2 Model CRUD DTOs
- [ ] 6.2.3 ModelSetting DTOs

### 6.3 Studio Schema
- [ ] 6.3.1 Project/Chapter/Shot DTOs
- [ ] 6.3.2 Entity DTOs
- [ ] 6.3.3 Image Task DTOs
- [ ] 6.3.4 File/Timeline DTOs

### 6.4 Script Processing Schema
- [ ] 6.4.1 ScriptDivision DTOs
- [ ] 6.4.2 ElementExtraction DTOs
- [ ] 6.4.3 EntityMerge DTOs
- [ ] 6.4.4 Analysis Result DTOs
- [ ] 6.4.5 FullProcess 输入/输出 DTOs

### 6.5 Film Schema
- [ ] 6.5.1 Video Generation DTOs
- [ ] 6.5.2 Image Generation DTOs

## Phase 7: 测试套件迁移与验证 [PENDING]

### 7.1 测试基础设施
- [ ] 7.1.1 Vitest 配置
- [ ] 7.1.2 测试数据库配置
- [ ] 7.1.3 测试模块和 Mock 工具

### 7.2 单元测试迁移
- [ ] 7.2.1 通用服务测试
- [ ] 7.2.2 Studio 服务测试
- [ ] 7.2.3 LLM 服务测试

### 7.3 集成测试
- [ ] 7.3.1 API 端点集成测试
- [ ] 7.3.2 Agent 工作流测试
- [ ] 7.3.3 数据库事务测试

### 7.4 E2E 测试
- [ ] 7.4.1 完整剧本处理流程测试
- [ ] 7.4.2 与 Python 版本输出对比测试

### 7.5 回归验证
- [ ] 7.5.1 所有 Python 测试用例在 NestJS 通过
- [ ] 7.5.2 API 响应格式一致性验证
- [ ] 7.5.3 Agent 输出质量对比

## Phase 8: 配置与部署 [PENDING]

### 8.1 环境配置
- [ ] 8.1.1 .env 配置文件
- [ ] 8.1.2 多环境配置
- [ ] 8.1.3 配置验证

### 8.2 部署配置
- [ ] 8.2.1 Dockerfile
- [ ] 8.2.2 docker-compose
- [ ] 8.2.3 CI/CD GitHub Actions

### 8.3 文档完善
- [ ] 8.3.1 README.md
- [ ] 8.3.2 API 文档
- [ ] 8.3.3 迁移说明

## Phase 9: 验收与优化 [PENDING]

### 9.1 功能验收
- [ ] 9.1.1 API 兼容性测试
- [ ] 9.1.2 Agent 输出质量对比
- [ ] 9.1.3 性能基准测试

### 9.2 性能优化
- [ ] 9.2.1 数据库查询优化
- [ ] 9.2.2 LangChain 调用优化
- [ ] 9.2.3 内存和 CPU 优化

### 9.3 代码质量
- [ ] 9.3.1 代码覆盖率检查（>80%）
- [ ] 9.3.2 TypeScript 严格类型检查
- [ ] 9.3.3 代码审查

## 工作量估算

| Phase | 预估工时 | 复杂度 |
|-------|----------|--------|
| Phase 0: 测试基线 | 8-12h | 🟡 中等 |
| Phase 1: 项目初始化 | 6-8h | 🟢 低 |
| Phase 2: 数据模型层 | 20-28h | 🔴 高 |
| Phase 3: 核心服务层 | 16-24h | 🟡 中等 |
| Phase 4: Agent 工作流 | 12-20h | 🔴 高 |
| Phase 5: API 路由层 | 12-16h | 🟢 低 |
| Phase 6: Schema 定义 | 8-12h | 🟢 低 |
| Phase 7: 测试套件 | 12-16h | 🟡 中等 |
| Phase 8: 配置部署 | 6-10h | 🟢 低 |
| Phase 9: 验收优化 | 8-12h | 🟡 中等 |
| **总计** | **108-158h** | - |

**人天估算**: 约 **4-5 周**（单人全职）
**并行优化**: 2 人并行可缩短至 **2-3 周**

## 风险评估

### 🔴 高风险
- LangGraph JS 功能差异
- 数据库迁移数据完整性
- Agent 输出质量一致性

### 🟡 中风险
- ORM 查询性能差异
- JSON 解析修复机制
- 类型系统边界情况

### 🟢 低风险
- 路由层转换
- 配置管理
- 日志系统
