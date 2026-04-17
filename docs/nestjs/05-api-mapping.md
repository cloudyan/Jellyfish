# API 端点映射

## 概述

本文档详细记录 Python FastAPI 后端与 NestJS 后端的 API 端点对照，确保 100% API 兼容性。

## 端点分类

### 1. 健康检查端点

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /health` | `GET /health` | GET | 服务健康状态 |
| `GET /version` | `GET /version` | GET | API 版本信息 |

### 2. LLM 管理端点

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /llm/providers` | `GET /llm/providers` | GET | 获取所有 Provider |
| `POST /llm/providers` | `POST /llm/providers` | POST | 创建 Provider |
| `GET /llm/providers/{id}` | `GET /llm/providers/:id` | GET | 获取 Provider 详情 |
| `PUT /llm/providers/{id}` | `PUT /llm/providers/:id` | PUT | 更新 Provider |
| `DELETE /llm/providers/{id}` | `DELETE /llm/providers/:id` | DELETE | 删除 Provider |
| `GET /llm/models` | `GET /llm/models` | GET | 获取所有 Model |
| `POST /llm/models` | `POST /llm/models` | POST | 创建 Model |
| `GET /llm/models/{id}` | `GET /llm/models/:id` | GET | 获取 Model 详情 |
| `PUT /llm/models/{id}` | `PUT /llm/models/:id` | PUT | 更新 Model |
| `DELETE /llm/models/{id}` | `DELETE /llm/models/:id` | DELETE | 删除 Model |
| `GET /llm/settings` | `GET /llm/settings` | GET | 获取所有 ModelSetting |
| `POST /llm/settings` | `POST /llm/settings` | POST | 创建 ModelSetting |
| `PUT /llm/settings/{id}` | `PUT /llm/settings/:id` | PUT | 更新 ModelSetting |

### 3. Studio 端点 - Project

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /studio/projects` | `GET /studio/projects` | GET | 获取项目列表 |
| `POST /studio/projects` | `POST /studio/projects` | POST | 创建项目 |
| `GET /studio/projects/{id}` | `GET /studio/projects/:id` | GET | 获取项目详情 |
| `PUT /studio/projects/{id}` | `PUT /studio/projects/:id` | PUT | 更新项目 |
| `DELETE /studio/projects/{id}` | `DELETE /studio/projects/:id` | DELETE | 删除项目 |

### 4. Studio 端点 - Chapter

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /studio/projects/{id}/chapters` | `GET /studio/projects/:id/chapters` | GET | 获取章节列表 |
| `POST /studio/projects/{id}/chapters` | `POST /studio/projects/:id/chapters` | POST | 创建章节 |
| `GET /studio/chapters/{id}` | `GET /studio/chapters/:id` | GET | 获取章节详情 |
| `PUT /studio/chapters/{id}` | `PUT /studio/chapters/:id` | PUT | 更新章节 |
| `DELETE /studio/chapters/{id}` | `DELETE /studio/chapters/:id` | DELETE | 删除章节 |
| `POST /studio/chapters/{id}/process` | `POST /studio/chapters/:id/process` | POST | 处理章节剧本 |

### 5. Studio 端点 - Shot

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /studio/chapters/{id}/shots` | `GET /studio/chapters/:id/shots` | GET | 获取镜头列表 |
| `POST /studio/chapters/{id}/shots` | `POST /studio/chapters/:id/shots` | POST | 创建镜头 |
| `GET /studio/shots/{id}` | `GET /studio/shots/:id` | GET | 获取镜头详情 |
| `PUT /studio/shots/{id}` | `PUT /studio/shots/:id` | PUT | 更新镜头 |
| `DELETE /studio/shots/{id}` | `DELETE /studio/shots/:id` | DELETE | 删除镜头 |
| `POST /studio/shots/{id}/generate-images` | `POST /studio/shots/:id/generate-images` | POST | 生成镜头图片 |
| `POST /studio/shots/{id}/generate-video` | `POST /studio/shots/:id/generate-video` | POST | 生成镜头视频 |

### 6. Studio 端点 - Entity (Character/Scene/Prop/Costume)

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /studio/projects/{id}/characters` | `GET /studio/projects/:id/characters` | GET | 获取角色列表 |
| `POST /studio/projects/{id}/characters` | `POST /studio/projects/:id/characters` | POST | 创建角色 |
| `GET /studio/characters/{id}` | `GET /studio/characters/:id` | GET | 获取角色详情 |
| `PUT /studio/characters/{id}` | `PUT /studio/characters/:id` | PUT | 更新角色 |
| `DELETE /studio/characters/{id}` | `DELETE /studio/characters/:id` | DELETE | 删除角色 |
| `GET /studio/projects/{id}/scenes` | `GET /studio/projects/:id/scenes` | GET | 获取场景列表 |
| `POST /studio/projects/{id}/scenes` | `POST /studio/projects/:id/scenes` | POST | 创建场景 |
| `GET /studio/scenes/{id}` | `GET /studio/scenes/:id` | GET | 获取场景详情 |
| `PUT /studio/scenes/{id}` | `PUT /studio/scenes/:id` | PUT | 更新场景 |
| `DELETE /studio/scenes/{id}` | `DELETE /studio/scenes/:id` | DELETE | 删除场景 |

### 7. Studio 端点 - File

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `POST /studio/files/upload` | `POST /studio/files/upload` | POST | 上传文件 |
| `GET /studio/files/{id}` | `GET /studio/files/:id` | GET | 获取文件信息 |
| `DELETE /studio/files/{id}` | `DELETE /studio/files/:id` | DELETE | 删除文件 |
| `GET /studio/files/{id}/download` | `GET /studio/files/:id/download` | GET | 下载文件 |

### 8. 脚本处理端点

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `POST /script-processing/divide` | `POST /script-processing/divide` | POST | 剧本分割 |
| `POST /script-processing/extract` | `POST /script-processing/extract` | POST | 元素提取 |
| `POST /script-processing/merge-entities` | `POST /script-processing/merge-entities` | POST | 实体合并 |
| `POST /script-processing/analyze-variants` | `POST /script-processing/analyze-variants` | POST | 变体分析 |
| `POST /script-processing/check-consistency` | `POST /script-processing/check-consistency` | POST | 一致性检查 |
| `POST /script-processing/optimize` | `POST /script-processing/optimize` | POST | 剧本优化 |
| `POST /script-processing/full-process` | `POST /script-processing/full-process` | POST | 完整处理流程 |
| `POST /script-processing/simplify-script` | `POST /script-processing/simplify-script` | POST | 剧本简化 |

### 9. 分析端点

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `POST /script-processing/analyze/character` | `POST /script-processing/analyze/character` | POST | 角色画像分析 |
| `POST /script-processing/analyze/scene` | `POST /script-processing/analyze/scene` | POST | 场景信息分析 |
| `POST /script-processing/analyze/costume` | `POST /script-processing/analyze/costume` | POST | 服装信息分析 |
| `POST /script-processing/analyze/prop` | `POST /script-processing/analyze/prop` | POST | 道具信息分析 |

### 10. Film 端点

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /film/videos` | `GET /film/videos` | GET | 获取视频列表 |
| `GET /film/videos/{id}` | `GET /film/videos/:id` | GET | 获取视频详情 |
| `POST /film/videos/{id}/regenerate` | `POST /film/videos/:id/regenerate` | POST | 重新生成视频 |
| `POST /film/shots/{id}/frame-prompts` | `POST /film/shots/:id/frame-prompts` | POST | 生成帧提示词 |
| `GET /film/image-tasks` | `GET /film/image-tasks` | GET | 获取图片任务列表 |
| `GET /film/image-tasks/{id}` | `GET /film/image-tasks/:id` | GET | 获取图片任务详情 |
| `POST /film/image-tasks/{id}/retry` | `POST /film/image-tasks/:id/retry` | POST | 重试图片任务 |

### 11. Timeline 端点

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /studio/projects/{id}/timeline` | `GET /studio/projects/:id/timeline` | GET | 获取时间线 |
| `PUT /studio/projects/{id}/timeline` | `PUT /studio/projects/:id/timeline` | PUT | 更新时间线 |

### 12. Task 端点

| Python (FastAPI) | NestJS | 方法 | 说明 |
|------------------|--------|------|------|
| `GET /studio/tasks` | `GET /studio/tasks` | GET | 获取任务列表 |
| `GET /studio/tasks/{id}` | `GET /studio/tasks/:id` | GET | 获取任务详情 |
| `POST /studio/tasks/{id}/cancel` | `POST /studio/tasks/:id/cancel` | POST | 取消任务 |

## 请求/响应格式对比

### 统一响应结构

**Python**:
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-04-08T10:30:00Z"
}
```

**NestJS** (保持一致):
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-04-08T10:30:00Z"
}
```

### 错误响应结构

**Python**:
```json
{
  "code": 400,
  "message": "Validation Error",
  "data": null,
  "error": {
    "field": "name",
    "detail": "Field required"
  }
}
```

**NestJS** (保持一致):
```json
{
  "code": 400,
  "message": "Validation Error",
  "data": null,
  "error": {
    "field": "name",
    "detail": "Field required"
  }
}
```

### 分页响应结构

**Python**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**NestJS** (保持一致):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

## 请求参数对比

### 查询参数

**Python**:
```python
@router.get("/projects")
def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    search: str | None = Query(None)
):
    ...
```

**NestJS**:
```typescript
@Get('projects')
async findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  @Query('status') status?: string,
  @Query('search') search?: string
) {
  ...
}
```

### 路径参数

**Python**:
```python
@router.get("/projects/{project_id}")
def get_project(project_id: int = Path(..., ge=1)):
    ...
```

**NestJS**:
```typescript
@Get('projects/:id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  ...
}
```

### 请求体

**Python**:
```python
@router.post("/projects")
def create_project(data: ProjectCreate):
    ...
```

**NestJS**:
```typescript
@Post('projects')
async create(@Body() createDto: CreateProjectDto) {
  ...
}
```

## API 版本策略

### URL 版本控制

**Python**:
```
/api/v1/projects
/api/v2/projects
```

**NestJS**:
```typescript
// app.module.ts
@Module({
  imports: [
    RouterModule.register([
      {
        path: 'api/v1',
        module: ApiV1Module,
      },
    ]),
  ],
})
```

### Header 版本控制 (备选)

**Python**:
```python
@app.middleware("http")
async def version_middleware(request: Request, call_next):
    version = request.headers.get("X-API-Version", "v1")
    ...
```

**NestJS**:
```typescript
// 使用 Version 装饰器
@Controller('projects')
export class ProjectsController {
  @Version('1')
  @Get()
  findAllV1() { ... }
  
  @Version('2')
  @Get()
  findAllV2() { ... }
}
```

## 迁移注意事项

1. **路径格式**: Python 使用 `{param}`，NestJS 使用 `:param`
2. **查询参数**: Python 自动转换 snake_case，NestJS 需要显式映射
3. **响应格式**: 必须保持完全一致，确保前端兼容性
4. **错误码**: HTTP 状态码和自定义错误码必须一致
5. **数据格式**: 日期、枚举等格式保持一致

## 兼容性测试清单

- [ ] 所有端点 URL 路径一致
- [ ] 所有请求方法一致
- [ ] 所有请求参数格式一致
- [ ] 所有响应数据结构一致
- [ ] 所有错误响应格式一致
- [ ] 所有 HTTP 状态码一致
- [ ] Swagger/OpenAPI 文档完整
