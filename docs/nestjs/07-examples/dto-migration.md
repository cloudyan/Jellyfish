# DTO 迁移示例

本文档展示如何将 Python Pydantic Schemas 迁移到 TypeScript Zod DTOs。

## 1. Provider DTOs

### Python Pydantic

```python
# schemas/llm.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

class ProviderBase(BaseModel):
    """Provider 基础 Schema"""
    name: str = Field(..., min_length=1, max_length=50, description="Provider 名称")
    display_name: str = Field(..., min_length=1, max_length=100, description="显示名称")
    base_url: Optional[str] = Field(None, max_length=500, description="API 基础 URL")
    api_key: Optional[str] = Field(None, max_length=500, description="API Key")
    is_active: bool = Field(True, description="是否激活")
    sort_order: int = Field(0, ge=0, description="排序顺序")

class ProviderCreate(ProviderBase):
    """创建 Provider 请求 Schema"""
    pass

class ProviderUpdate(BaseModel):
    """更新 Provider 请求 Schema"""
    model_config = ConfigDict(extra='forbid')
    
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    base_url: Optional[str] = Field(None, max_length=500)
    api_key: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)

class ProviderInDB(ProviderBase):
    """数据库中的 Provider Schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime

class ProviderResponse(ProviderInDB):
    """Provider 响应 Schema"""
    pass

class ProviderListResponse(BaseModel):
    """Provider 列表响应"""
    items: List[ProviderResponse]
    total: int
    page: int
    page_size: int
```

### TypeScript Zod + nestjs-zod

```typescript
// llm/dto/provider.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// 基础 Schema
export const ProviderBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Provider 名称不能为空')
    .max(50, 'Provider 名称不能超过 50 个字符')
    .describe('Provider 名称'),
  displayName: z
    .string()
    .min(1, '显示名称不能为空')
    .max(100, '显示名称不能超过 100 个字符')
    .describe('显示名称'),
  baseUrl: z
    .string()
    .max(500, 'URL 不能超过 500 个字符')
    .url('必须是有效的 URL')
    .optional()
    .describe('API 基础 URL'),
  apiKey: z
    .string()
    .max(500, 'API Key 不能超过 500 个字符')
    .optional()
    .describe('API Key'),
  isActive: z
    .boolean()
    .default(true)
    .describe('是否激活'),
  sortOrder: z
    .number()
    .int()
    .min(0, '排序顺序不能为负数')
    .default(0)
    .describe('排序顺序'),
});

// 创建请求 Schema
export const CreateProviderSchema = ProviderBaseSchema;

// 更新请求 Schema（所有字段可选）
export const UpdateProviderSchema = ProviderBaseSchema.partial();

// 响应 Schema（包含数据库字段）
export const ProviderResponseSchema = ProviderBaseSchema.extend({
  id: z.number().int().describe('ID'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
});

// 列表响应 Schema
export const ProviderListResponseSchema = z.object({
  items: z.array(ProviderResponseSchema),
  total: z.number().int().describe('总数'),
  page: z.number().int().describe('当前页'),
  pageSize: z.number().int().describe('每页数量'),
});

// ===== DTO 类定义 =====

export class CreateProviderDto extends createZodDto(CreateProviderSchema) {}
export class UpdateProviderDto extends createZodDto(UpdateProviderSchema) {}
export class ProviderResponseDto extends createZodDto(ProviderResponseSchema) {}
export class ProviderListResponseDto extends createZodDto(ProviderListResponseSchema) {}

// 类型导出
export type CreateProviderType = z.infer<typeof CreateProviderSchema>;
export type UpdateProviderType = z.infer<typeof UpdateProviderSchema>;
export type ProviderResponseType = z.infer<typeof ProviderResponseSchema>;
export type ProviderListResponseType = z.infer<typeof ProviderListResponseSchema>;
```

## 2. Project DTOs

### Python Pydantic

```python
# schemas/project.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Literal
from enum import Enum

class ProjectStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: ProjectStatus = Field(ProjectStatus.DRAFT)
    cover_image: Optional[str] = Field(None, max_length=500)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[ProjectStatus] = None
    cover_image: Optional[str] = Field(None, max_length=500)

class ProjectInDB(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime

class ChapterBrief(BaseModel):
    """章节简要信息"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    chapter_number: int
    title: Optional[str]
    status: str

class ProjectDetail(ProjectInDB):
    """项目详情（包含章节）"""
    chapters: List[ChapterBrief] = []

class ProjectResponse(BaseModel):
    success: bool
    data: ProjectDetail
    message: Optional[str] = None
```

### TypeScript Zod

```typescript
// studio/dto/project.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// 枚举定义
export const ProjectStatus = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];

// 基础 Schema
export const ProjectBaseSchema = z.object({
  title: z
    .string()
    .min(1, '标题不能为空')
    .max(200, '标题不能超过 200 个字符'),
  description: z
    .string()
    .max(2000, '描述不能超过 2000 个字符')
    .optional(),
  status: z
    .enum(['draft', 'in_progress', 'completed', 'archived'])
    .default('draft'),
  coverImage: z
    .string()
    .max(500, '图片 URL 不能超过 500 个字符')
    .optional(),
});

// 创建请求
export const CreateProjectSchema = ProjectBaseSchema;

// 更新请求
export const UpdateProjectSchema = ProjectBaseSchema.partial();

// 章节简要信息
export const ChapterBriefSchema = z.object({
  id: z.number().int(),
  chapterNumber: z.number().int(),
  title: z.string().optional(),
  status: z.string(),
});

// 数据库响应
export const ProjectInDbSchema = ProjectBaseSchema.extend({
  id: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 详情响应（包含章节）
export const ProjectDetailSchema = ProjectInDbSchema.extend({
  chapters: z.array(ChapterBriefSchema).default([]),
});

// API 响应包装
export const ProjectResponseSchema = z.object({
  success: z.boolean(),
  data: ProjectDetailSchema,
  message: z.string().optional(),
});

// ===== DTO 类 =====

export class CreateProjectDto extends createZodDto(CreateProjectSchema) {}
export class UpdateProjectDto extends createZodDto(UpdateProjectSchema) {}
export class ProjectResponseDto extends createZodDto(ProjectResponseSchema) {}

// 类型导出
export type CreateProjectType = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectType = z.infer<typeof UpdateProjectSchema>;
export type ProjectDetailType = z.infer<typeof ProjectDetailSchema>;
export type ProjectResponseType = z.infer<typeof ProjectResponseSchema>;
```

## 3. Script Processing DTOs

### Python Pydantic

```python
# schemas/script_processing.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal

class DialogLine(BaseModel):
    """对话行"""
    character: str = Field(..., description="角色名")
    content: str = Field(..., description="对话内容")
    emotion: Optional[str] = Field(None, description="情绪")
    action: Optional[str] = Field(None, description="动作")

class ShotData(BaseModel):
    """镜头数据"""
    shot_number: str = Field(..., description="镜头编号")
    content: str = Field(..., description="内容描述")
    scene_description: Optional[str] = Field(None, description="场景描述")
    dialog_lines: List[DialogLine] = Field(default=[], description="对话列表")

class ScriptDivisionResult(BaseModel):
    """剧本分割结果"""
    shots: List[ShotData] = Field(..., description="镜头列表")

class ScriptDivisionRequest(BaseModel):
    """剧本分割请求"""
    chapter_id: int = Field(..., gt=0, description="章节 ID")
    script_content: str = Field(..., min_length=1, description="剧本内容")
    options: Dict[str, Any] = Field(default={}, description="选项")

class ElementExtractionRequest(BaseModel):
    """元素提取请求"""
    chapter_id: int = Field(..., gt=0)
    extraction_types: List[Literal["characters", "scenes", "props", "costumes"]] = Field(
        default=["characters", "scenes"]
    )

class ExtractedEntity(BaseModel):
    """提取的实体"""
    name: str
    type: str
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default={})

class ElementExtractionResult(BaseModel):
    """元素提取结果"""
    characters: List[ExtractedEntity] = []
    scenes: List[ExtractedEntity] = []
    props: List[ExtractedEntity] = []
    costumes: List[ExtractedEntity] = []

class FullProcessRequest(BaseModel):
    """完整处理请求"""
    chapter_id: int = Field(..., gt=0)
    script_content: str = Field(..., min_length=1)
    options: FullProcessOptions = Field(default_factory=FullProcessOptions)

class FullProcessOptions(BaseModel):
    """处理选项"""
    auto_merge: bool = Field(True, description="自动合并实体")
    check_consistency: bool = Field(True, description="检查一致性")
    generate_images: bool = Field(False, description="生成图片")
    model_id: Optional[str] = Field(None, description="模型 ID")

class FullProcessResult(BaseModel):
    """完整处理结果"""
    success: bool
    shots: List[ShotData]
    entities: ElementExtractionResult
    consistency_issues: List[str] = []
    message: Optional[str] = None
```

### TypeScript Zod

```typescript
// script-processing/dto/script-processing.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// 对话行
export const DialogLineSchema = z.object({
  character: z.string().describe('角色名'),
  content: z.string().describe('对话内容'),
  emotion: z.string().optional().describe('情绪'),
  action: z.string().optional().describe('动作'),
});

// 镜头数据
export const ShotDataSchema = z.object({
  shotNumber: z.string().describe('镜头编号'),
  content: z.string().describe('内容描述'),
  sceneDescription: z.string().optional().describe('场景描述'),
  dialogLines: z.array(DialogLineSchema).default([]).describe('对话列表'),
});

// 剧本分割结果
export const ScriptDivisionResultSchema = z.object({
  shots: z.array(ShotDataSchema).describe('镜头列表'),
});

// 剧本分割请求
export const ScriptDivisionRequestSchema = z.object({
  chapterId: z.number().int().positive('章节 ID 必须大于 0').describe('章节 ID'),
  scriptContent: z.string().min(1, '剧本内容不能为空').describe('剧本内容'),
  options: z.record(z.any()).default({}).describe('选项'),
});

// 元素提取请求
export const ElementExtractionRequestSchema = z.object({
  chapterId: z.number().int().positive(),
  extractionTypes: z
    .array(z.enum(['characters', 'scenes', 'props', 'costumes']))
    .default(['characters', 'scenes']),
});

// 提取的实体
export const ExtractedEntitySchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).default({}),
});

// 元素提取结果
export const ElementExtractionResultSchema = z.object({
  characters: z.array(ExtractedEntitySchema).default([]),
  scenes: z.array(ExtractedEntitySchema).default([]),
  props: z.array(ExtractedEntitySchema).default([]),
  costumes: z.array(ExtractedEntitySchema).default([]),
});

// 处理选项
export const FullProcessOptionsSchema = z.object({
  autoMerge: z.boolean().default(true).describe('自动合并实体'),
  checkConsistency: z.boolean().default(true).describe('检查一致性'),
  generateImages: z.boolean().default(false).describe('生成图片'),
  modelId: z.string().optional().describe('模型 ID'),
});

// 完整处理请求
export const FullProcessRequestSchema = z.object({
  chapterId: z.number().int().positive(),
  scriptContent: z.string().min(1),
  options: FullProcessOptionsSchema.default({}),
});

// 完整处理结果
export const FullProcessResultSchema = z.object({
  success: z.boolean(),
  shots: z.array(ShotDataSchema),
  entities: ElementExtractionResultSchema,
  consistencyIssues: z.array(z.string()).default([]),
  message: z.string().optional(),
});

// ===== DTO 类 =====

export class ScriptDivisionRequestDto extends createZodDto(ScriptDivisionRequestSchema) {}
export class ElementExtractionRequestDto extends createZodDto(ElementExtractionRequestSchema) {}
export class FullProcessRequestDto extends createZodDto(FullProcessRequestSchema) {}

// 类型导出
export type DialogLine = z.infer<typeof DialogLineSchema>;
export type ShotData = z.infer<typeof ShotDataSchema>;
export type ScriptDivisionResult = z.infer<typeof ScriptDivisionResultSchema>;
export type ScriptDivisionRequest = z.infer<typeof ScriptDivisionRequestSchema>;
export type ElementExtractionResult = z.infer<typeof ElementExtractionResultSchema>;
export type FullProcessRequest = z.infer<typeof FullProcessRequestSchema>;
export type FullProcessResult = z.infer<typeof FullProcessResultSchema>;
```

## 4. 通用响应 DTO

```typescript
// common/dto/api-response.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// 分页信息
export const PaginationSchema = z.object({
  page: z.number().int().default(1).describe('当前页'),
  pageSize: z.number().int().default(20).describe('每页数量'),
  total: z.number().int().describe('总数'),
  totalPages: z.number().int().describe('总页数'),
});

// 错误详情
export const ErrorDetailSchema = z.object({
  field: z.string().optional().describe('错误字段'),
  message: z.string().describe('错误信息'),
  code: z.string().optional().describe('错误码'),
});

// 错误响应
export const ErrorResponseSchema = z.object({
  code: z.string().describe('错误码'),
  message: z.string().describe('错误信息'),
  details: z.array(ErrorDetailSchema).optional().describe('详细错误'),
});

// 通用成功响应（泛型）
export function createSuccessResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });
}

// 通用分页响应
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationSchema,
    }),
    message: z.string().optional(),
  });
}

// 通用错误响应
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ErrorResponseSchema,
});

// 类型导出
export type Pagination = z.infer<typeof PaginationSchema>;
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
```

## 5. 验证管道配置

```typescript
// common/pipes/zod-validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    
    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求参数验证失败',
          details: errors,
        },
      });
    }
    
    return result.data;
  }
}
```

## 关键差异对比

| 特性 | Python Pydantic | TypeScript Zod |
|------|-----------------|----------------|
| 类型定义 | 类继承 | 函数式 Schema |
| 验证 | Field() | 链式方法 |
| 可选字段 | Optional[T] | .optional() |
| 默认值 | Field(default=) | .default() |
| 嵌套模型 | 类引用 | z.object() 引用 |
| 枚举 | Enum 类 | z.enum() |
| 联合类型 | Union[T1, T2] | z.union() |
| 转换 | ConfigDict | 管道处理 |
