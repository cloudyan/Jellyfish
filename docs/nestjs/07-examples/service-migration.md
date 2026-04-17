# Service 迁移示例

本文档展示如何将 Python FastAPI Service 迁移到 TypeScript NestJS。

## 1. LLMService 迁移

### Python 版本

```python
# services/llm.py
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.llm import Provider, Model, ModelSetting
from app.schemas.llm import ProviderCreate, ProviderUpdate, ProviderResponse

class LLMService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_providers(
        self, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Provider]:
        """获取 Provider 列表"""
        query = self.db.query(Provider)
        
        if is_active is not None:
            query = query.filter(Provider.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    def get_provider(self, provider_id: int) -> Optional[Provider]:
        """获取单个 Provider"""
        return self.db.query(Provider).filter(Provider.id == provider_id).first()
    
    def create_provider(self, data: ProviderCreate) -> Provider:
        """创建 Provider"""
        try:
            provider = Provider(**data.model_dump())
            self.db.add(provider)
            self.db.commit()
            self.db.refresh(provider)
            return provider
        except IntegrityError:
            self.db.rollback()
            raise ValueError(f"Provider with name '{data.name}' already exists")
    
    def update_provider(
        self, 
        provider_id: int, 
        data: ProviderUpdate
    ) -> Provider:
        """更新 Provider"""
        provider = self.get_provider(provider_id)
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(provider, field, value)
        
        self.db.commit()
        self.db.refresh(provider)
        return provider
    
    def delete_provider(self, provider_id: int) -> None:
        """删除 Provider"""
        provider = self.get_provider(provider_id)
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")
        
        self.db.delete(provider)
        self.db.commit()

# Dependency
def get_llm_service(db: Session = Depends(get_db)):
    return LLMService(db)
```

### TypeScript/NestJS 版本

```typescript
// llm/llm.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LLMService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取 Provider 列表
   */
  async findAll(options: {
    skip?: number;
    take?: number;
    isActive?: boolean;
  } = {}) {
    const { skip = 0, take = 100, isActive } = options;

    const where: Prisma.ProviderWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.provider.findMany({
      where,
      skip,
      take,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * 获取单个 Provider
   */
  async findOne(id: number) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider ${id} not found`);
    }

    return provider;
  }

  /**
   * 创建 Provider
   */
  async create(data: CreateProviderDto) {
    try {
      return await this.prisma.provider.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`Provider with name '${data.name}' already exists`);
        }
      }
      throw error;
    }
  }

  /**
   * 更新 Provider
   */
  async update(id: number, data: UpdateProviderDto) {
    try {
      return await this.prisma.provider.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Provider ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException(`Provider name already exists`);
        }
      }
      throw error;
    }
  }

  /**
   * 删除 Provider
   */
  async remove(id: number) {
    try {
      await this.prisma.provider.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Provider ${id} not found`);
        }
      }
      throw error;
    }
  }
}
```

### Controller

```typescript
// llm/llm.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LLMService } from './llm.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@ApiTags('LLM')
@Controller('llm')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Get('providers')
  @ApiOperation({ summary: '获取 Provider 列表' })
  @ApiResponse({ status: 200, description: '成功返回 Provider 列表' })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('is_active') isActive?: string,
  ) {
    const providers = await this.llmService.findAll({
      skip,
      take,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    return {
      success: true,
      data: providers,
    };
  }

  @Get('providers/:id')
  @ApiOperation({ summary: '获取指定 Provider' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const provider = await this.llmService.findOne(id);
    return {
      success: true,
      data: provider,
    };
  }

  @Post('providers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建 Provider' })
  async create(@Body() createDto: CreateProviderDto) {
    const provider = await this.llmService.create(createDto);
    return {
      success: true,
      data: provider,
      message: 'Provider created successfully',
    };
  }

  @Put('providers/:id')
  @ApiOperation({ summary: '更新 Provider' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProviderDto,
  ) {
    const provider = await this.llmService.update(id, updateDto);
    return {
      success: true,
      data: provider,
      message: 'Provider updated successfully',
    };
  }

  @Delete('providers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 Provider' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.llmService.remove(id);
  }
}
```

### Module

```typescript
// llm/llm.module.ts
import { Module } from '@nestjs/common';
import { LLMController } from './llm.controller';
import { LLMService } from './llm.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LLMController],
  providers: [LLMService],
  exports: [LLMService],
})
export class LLMModule {}
```

## 2. ProjectService 迁移

### Python 版本

```python
# services/project.py
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.models.studio import Project, Chapter
from app.schemas.project import ProjectCreate, ProjectUpdate

class ProjectService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_projects(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[Project]:
        """获取项目列表"""
        query = self.db.query(Project)
        
        if status:
            query = query.filter(Project.status == status)
        
        return query.order_by(desc(Project.created_at)).offset(skip).limit(limit).all()
    
    def get_project_with_chapters(self, project_id: int) -> Optional[Project]:
        """获取项目及其章节"""
        return self.db.query(Project).options(
            joinedload(Project.chapters)
        ).filter(Project.id == project_id).first()
    
    def create_project(self, data: ProjectCreate) -> Project:
        """创建项目"""
        project = Project(**data.model_dump())
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project
    
    def update_project(
        self,
        project_id: int,
        data: ProjectUpdate
    ) -> Project:
        """更新项目"""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        
        self.db.commit()
        self.db.refresh(project)
        return project
    
    def delete_project(self, project_id: int) -> None:
        """删除项目（级联删除章节）"""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        # SQLAlchemy 会处理级联删除
        self.db.delete(project)
        self.db.commit()
```

### TypeScript/NestJS 版本

```typescript
// studio/services/project.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取项目列表
   */
  async findAll(options: {
    skip?: number;
    take?: number;
    status?: string;
  } = {}) {
    const { skip = 0, take = 100, status } = options;

    const where: Prisma.ProjectWhereInput = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取项目及其章节
   */
  async findOneWithChapters(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  /**
   * 创建项目
   */
  async create(data: CreateProjectDto) {
    return this.prisma.project.create({ data });
  }

  /**
   * 更新项目
   */
  async update(id: number, data: UpdateProjectDto) {
    try {
      return await this.prisma.project.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Project ${id} not found`);
        }
      }
      throw error;
    }
  }

  /**
   * 删除项目（级联删除章节）
   */
  async remove(id: number) {
    try {
      // Prisma 会自动处理级联删除（需要在 schema 中配置）
      await this.prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Project ${id} not found`);
        }
      }
      throw error;
    }
  }

  /**
   * 统计项目数量
   */
  async count(options: { status?: string } = {}) {
    const where: Prisma.ProjectWhereInput = {};
    if (options.status) {
      where.status = options.status;
    }

    return this.prisma.project.count({ where });
  }
}
```

## 3. ModelResolver 服务迁移

### Python 版本

```python
# services/model_resolver.py
from typing import Dict, Any
from langchain_openai import ChatOpenAI, AzureChatOpenAI
from langchain_anthropic import ChatAnthropic
from app.models.llm import Provider, Model
from app.services.llm import LLMService

class ModelResolver:
    """模型解析器 - 根据 model_id 返回对应的 LLM 实例"""
    
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service
        self._cache: Dict[str, Any] = {}
    
    async def resolve(self, model_id: str, **kwargs) -> Any:
        """解析模型 ID 并返回 LLM 实例"""
        # 检查缓存
        cache_key = f"{model_id}:{hash(str(kwargs))}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # 获取模型配置
        model = self.llm_service.get_model_by_model_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        provider = model.provider
        settings = model.settings
        
        # 创建 LLM 实例
        llm = self._create_llm(provider, model, settings, **kwargs)
        
        # 缓存
        self._cache[cache_key] = llm
        return llm
    
    def _create_llm(
        self, 
        provider: Provider, 
        model: Model, 
        settings: Any,
        **kwargs
    ) -> Any:
        """创建 LLM 实例"""
        common_params = {
            "model": model.model_id,
            "temperature": kwargs.get("temperature", settings.temperature if settings else 0.7),
            "max_tokens": kwargs.get("max_tokens", settings.max_tokens if settings else None),
        }
        
        if provider.name == "openai":
            return ChatOpenAI(
                api_key=provider.api_key,
                base_url=provider.base_url,
                **common_params
            )
        elif provider.name == "anthropic":
            return ChatAnthropic(
                api_key=provider.api_key,
                **common_params
            )
        elif provider.name == "azure_openai":
            return AzureChatOpenAI(
                api_key=provider.api_key,
                azure_endpoint=provider.base_url,
                **common_params
            )
        else:
            raise ValueError(f"Unsupported provider: {provider.name}")
```

### TypeScript/NestJS 版本

```typescript
// llm/services/model-resolver.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { PrismaService } from '../../prisma/prisma.service';

interface ResolveOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

@Injectable()
export class ModelResolverService {
  private cache: Map<string, BaseChatModel> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 解析模型 ID 并返回 LLM 实例
   */
  async resolve(modelId: string, options: ResolveOptions = {}): Promise<BaseChatModel> {
    // 检查缓存
    const cacheKey = this.getCacheKey(modelId, options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 获取模型配置
    const model = await this.prisma.model.findFirst({
      where: { modelId },
      include: {
        provider: true,
        modelSettings: true,
      },
    });

    if (!model) {
      throw new NotFoundException(`Model ${modelId} not found`);
    }

    // 创建 LLM 实例
    const llm = this.createLLM(model, options);

    // 缓存
    this.cache.set(cacheKey, llm);
    return llm;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  private getCacheKey(modelId: string, options: ResolveOptions): string {
    return `${modelId}:${JSON.stringify(options)}`;
  }

  private createLLM(
    model: any,
    options: ResolveOptions,
  ): BaseChatModel {
    const settings = model.modelSettings?.[0];
    const provider = model.provider;

    const commonParams = {
      model: model.modelId,
      temperature: options.temperature ?? settings?.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? settings?.maxTokens ?? undefined,
      topP: options.topP ?? settings?.topP ?? undefined,
    };

    switch (provider.name) {
      case 'openai':
        return new ChatOpenAI({
          apiKey: provider.apiKey || undefined,
          configuration: provider.baseUrl
            ? { baseURL: provider.baseUrl }
            : undefined,
          ...commonParams,
        });

      case 'anthropic':
        return new ChatAnthropic({
          apiKey: provider.apiKey || undefined,
          ...commonParams,
        });

      // 可以根据需要添加更多 Provider
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }
}
```

## 关键差异对比

| 特性 | Python SQLAlchemy | TypeScript Prisma |
|------|-------------------|-------------------|
| 查询 | `db.query(Model)` | `prisma.model.findMany()` |
| 过滤 | `.filter()` | `where` 对象 |
| 关联 | `joinedload()` | `include` 对象 |
| 排序 | `.order_by()` | `orderBy` 对象 |
| 分页 | `.offset().limit()` | `skip`/`take` |
| 事务 | `db.commit()` | 自动处理 |
| 错误 | 手动检查 | Prisma 错误码 |

| 特性 | Python FastAPI | NestJS |
|------|----------------|--------|
| 依赖注入 | 函数参数 | 构造函数 |
| 异常处理 | 手动 raise | Exception Filters |
| 响应格式 | 手动构建 | Interceptors |
| 装饰器 | 路由装饰器 | @Injectable, @Controller |
| 模块 | 文件组织 | @Module |
