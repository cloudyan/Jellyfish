# AGENTS - Jellyfish 开发协作规范

本文档定义了 AI Agent 在 Jellyfish 项目中开发时需要遵循的构建、测试和代码风格规范。

## 目录

- [构建、检查与测试命令](#构建检查与测试命令)
  - [后端 (Python/FastAPI)](#后端-pythonfastapi)
  - [前端 (TypeScript/React)](#前端-typescriptreact)
- [代码风格指南](#代码风格指南)
  - [通用约定](#通用约定)
  - [Python 后端规范](#python-后端规范)
  - [TypeScript 前端规范](#typescript-前端规范)
- [现有 AI 助手规则](#现有-ai-助手规则)

---

## 构建、检查与测试命令

### 后端 (Python/FastAPI)

项目使用 **uv** 进行包管理，所有命令需要在 `backend/` 目录下执行。

**安装依赖：**
```bash
uv sync
uv sync --group dev  # 包含开发依赖（pytest、pylint 等）
```

**启动开发服务：**
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**代码检查：**
```bash
# Pylint 代码风格检查
uv run pylint app

# BasedPyright 类型检查（需要全局安装 basedpyright）
basedpyright

# 快速语法检查
python -m py_compile $(rg --files app tests)
```

**运行测试：**
```bash
# 运行所有测试
uv run pytest

# 运行单个测试文件（最常用）
uv run pytest tests/test_common_services.py -q

# 运行指定目录下的所有测试
uv run pytest tests/services/ -q

# 运行集成测试（需要配置 OPENAI_API_KEY）
uv run pytest -m integration -q

# 从项目根目录运行测试
uv run pytest backend/tests -q
```

**添加新依赖：**
```bash
uv add <package-name>
uv add --group dev <package-name>  # 开发依赖
```

### 前端 (TypeScript/React)

项目使用 **pnpm** 进行包管理，所有命令需要在 `front/` 目录下执行。

**安装依赖：**
```bash
pnpm install
```

**启动开发服务：**
```bash
pnpm dev
```
默认运行在 `http://localhost:5173`

**构建生产版本：**
```bash
pnpm build
```

**代码检查：**
```bash
# ESLint 检查
pnpm lint

# 修复可自动修复的问题
pnpm lint:fix

# TypeScript 类型检查
pnpm typecheck
```

**更新 OpenAPI 客户端（后端启动后）：**
```bash
# 从运行中的后端拉取 openapi.json 并重新生成客户端代码
pnpm openapi:update
```

**预览生产构建：**
```bash
pnpm preview
```

---

## 代码风格指南

### 通用约定

1. **提交规范**：遵循 [Conventional Commits](https://www.conventionalcommits.org/)，格式为 `[类型] 摘要`
   - 允许的类型：`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`
   - 示例：`[feat] 新增分镜批量编辑`、`[fix] 修复模型列表分页`

2. **行宽**：最大 100 个字符

3. **缩进**：使用 4 空格（Python）或 2 空格（TypeScript/JSX）

4. **命名**：
   - 类：大驼峰 (PascalCase)
   - 函数/变量：小蛇形 (snake_case) for Python，小驼峰 (camelCase) for TypeScript
   - 常量：全大写下划线分隔 (UPPER_SNAKE_CASE)
   - 私有方法/属性：前缀下划线 (`_`)

5. **注释**：复杂逻辑必须添加注释，TODO 需要关联责任人

### Python 后端规范

#### 导入顺序

按照标准库 → 第三方库 → 本地模块 分组，每组之间空一行：

```python
# 标准库
import os
from typing import Annotated

# 第三方库
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException

# 本地模块
from app.core.db import db
from app.models.models import Shot
from app.schemas.shot import ShotCreate
from app.dependencies import get_db
```

#### 类型标注

- 所有公共函数必须添加类型标注
- 使用 `Optional[T]` 表示可为空，不使用 `T | None` 语法（保持兼容性）
- 使用 `list[T]` 而非 `List[T]`（Python 3.9+ 泛型语法）

示例：
```python
def get_by_id(self, session: AsyncSession, obj_id: int) -> Optional[MyModel]:
    ...
```

#### 错误处理

- 使用项目提供的统一错误包装函数：
  - `entity_not_found(...)` - 实体不存在
  - `entity_already_exists(...)` - 实体已存在
  - `required_field(...)` - 必填字段缺失
  - `invalid_choice(...)` - 选项无效
  - `not_belong_to(...)` - 实体不属于上级资源

- API 响应统一使用 `ApiResponse` 封装：
  - `created_response(...)` - 创建成功
  - `success_response(...)` - 普通成功
  - `empty_response()` - 空响应成功
  - `paginated_response(...)` - 分页成功

#### 分层架构

遵循"路由层瘦身，业务逻辑下沉"原则：

- `app/api/v1/routes/`：只保留参数解析、依赖注入、调用 service、返回响应
- `app/services/`：业务逻辑实现，按模块划分（common, studio, llm, film 等）
- `app/models/`：SQLAlchemy ORM 模型
- `app/schemas/`：Pydantic 请求/响应模式
- `app/chains/`：LangChain PromptTemplate、LangGraph 工作流

#### Pylint 规则

项目在 `pyproject.toml` 中已经禁用了大量噪音规则，重点关注：
- 未使用的导入
- 语法错误
- 明显的风格问题

### TypeScript 前端规范

#### 导入顺序

按照 第三方库 → 类型 → 本地模块/组件 分组：

```typescript
// 第三方库
import React, { useState, useEffect } from 'react'
import { Button, Card } from 'antd'

// 类型
import type { Shot } from '@/services/generated'

// 本地组件/工具
import { ApiService } from '@/services/api'

// 样式
import './MyComponent.css'
```

#### 类型使用

- 优先使用接口（`interface`）定义对象结构
- 使用联合类型替代枚举（当不需要枚举值时）
- 对于 API 返回的类型，优先使用 OpenAPI 生成的类型定义，不要重复定义

示例：
```typescript
interface Props {
  title: string
  onSubmit: (data: FormData) => Promise<void>
  disabled?: boolean
}
```

#### 组件编写

- 使用函数式组件 + Hooks
- 使用 React.FC 类型明确标注组件类型
- Props 接口命名为 `ComponentNameProps`

示例：
```typescript
interface ShotCardProps {
  title: string
  description?: string
}

const ShotCard: FC<ShotCardProps> = ({ title, description }) => {
  return (
    <Card title={title}>
      <p>{description}</p>
    </Card>
  )
}

export default ShotCard
```

#### 样式

- 优先使用 Tailwind CSS 工具类
- 组件特定样式可以放在 CSS 文件中
- Ant Design 和 Tailwind CSS 已做兼容，不用担心冲突

#### ESLint 规则

- 必须通过 ESLint 检查，禁止新增 `any` 类型（除非必要）
- React Hooks 必须遵循 React Hooks 规则

---

## 现有 AI 助手规则

### Cursor

项目在 `.cursor/skills/` 目录下已安装 `ui-ux-pro-max` 技能，提供 UI/UX 设计智能支持：

- 支持 50+ 预设样式和 21+ 调色板
- 支持 React、Next.js、TypeScript 等技术栈
- 集成 shadcn/ui 组件搜索

### GitHub Copilot

项目无额外 `.copilot` 配置文件，使用默认设置，但需要：
- 遵循本文档定义的代码风格
- 生成代码后必须经过 ESLint/Pylint 检查

---

## 快速检查清单

在提交代码前，请确认：

- [ ] 代码可以正常编译/运行
- [ ] 相关测试通过（至少测试修改的单个模块：`uv run pytest tests/test_file.py -q`）
- [ ] 通过了 Pylint（后端）和 ESLint（前端）检查
- [ ] 通过了类型检查（Pyright / TypeScript）
- [ ] 遵循了本文档的代码风格规范
- [ ] 提交信息符合项目约定
