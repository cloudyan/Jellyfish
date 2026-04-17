# 架构对比：Python FastAPI vs NestJS

## 整体架构概览

### Python FastAPI 架构
```
backend/
├── app/
│   ├── main.py              # FastAPI 应用入口
│   ├── database.py          # SQLAlchemy 配置
│   ├── models/              # SQLAlchemy ORM 模型
│   ├── schemas/             # Pydantic 验证模型
│   ├── routers/             # API 路由
│   ├── services/            # 业务逻辑服务
│   ├── agents/              # LangChain Agent
│   └── utils/               # 工具函数
├── tests/
└── alembic/                 # 数据库迁移
```

### NestJS 目标架构
```
backend-nestjs/
├── src/
│   ├── main.ts              # NestJS 应用入口
│   ├── app.module.ts        # 根模块
│   ├── config/              # 配置管理
│   ├── common/              # 通用模块
│   │   ├── filters/         # 异常过滤器
│   │   ├── interceptors/    # 拦截器
│   │   └── decorators/      # 自定义装饰器
│   ├── prisma/              # Prisma 模块
│   ├── llm/                 # LLM 管理模块
│   ├── studio/              # Studio 业务模块
│   ├── film/                # Film 技能模块
│   ├── script-processing/   # 脚本处理模块
│   ├── chains/              # LangChain 工作流
│   └── utils/               # 工具函数
├── prisma/
│   ├── schema.prisma        # Prisma Schema
│   └── migrations/          # 数据库迁移
└── test/                    # Vitest 测试
```

## 核心概念映射

### 1. 应用入口

**Python FastAPI**:
```python
# main.py
from fastapi import FastAPI
from app.routers import llm, studio, script_processing

app = FastAPI(title="Jellyfish API")

app.include_router(llm.router, prefix="/llm")
app.include_router(studio.router, prefix="/studio")
app.include_router(script_processing.router, prefix="/script-processing")

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

**NestJS**:
```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('Jellyfish API')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(8000);
}
bootstrap();
```

### 2. 路由/控制器

**Python FastAPI**:
```python
# routers/llm.py
from fastapi import APIRouter, Depends
from app.schemas.llm import ProviderCreate, ProviderResponse
from app.services.llm import LLMService

router = APIRouter()

@router.get("/providers", response_model=list[ProviderResponse])
def list_providers(
    service: LLMService = Depends(get_llm_service)
):
    return service.get_providers()

@router.post("/providers", response_model=ProviderResponse)
def create_provider(
    data: ProviderCreate,
    service: LLMService = Depends(get_llm_service)
):
    return service.create_provider(data)
```

**NestJS**:
```typescript
// llm/llm.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LLMService } from './llm.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { ProviderResponseDto } from './dto/provider-response.dto';

@ApiTags('LLM')
@Controller('llm')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Get('providers')
  @ApiOperation({ summary: '获取所有 Provider' })
  async findAll(): Promise<ProviderResponseDto[]> {
    return this.llmService.findAll();
  }

  @Post('providers')
  @ApiOperation({ summary: '创建 Provider' })
  async create(
    @Body() createDto: CreateProviderDto
  ): Promise<ProviderResponseDto> {
    return this.llmService.create(createDto);
  }
}
```

### 3. 服务层

**Python FastAPI**:
```python
# services/llm.py
from sqlalchemy.orm import Session
from app.models.llm import Provider
from app.schemas.llm import ProviderCreate

class LLMService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_providers(self) -> list[Provider]:
        return self.db.query(Provider).all()
    
    def create_provider(self, data: ProviderCreate) -> Provider:
        provider = Provider(**data.model_dump())
        self.db.add(provider)
        self.db.commit()
        return provider

def get_llm_service(db: Session = Depends(get_db)):
    return LLMService(db)
```

**NestJS**:
```typescript
// llm/llm.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';

@Injectable()
export class LLMService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.provider.findMany();
  }

  async create(data: CreateProviderDto) {
    return this.prisma.provider.create({ data });
  }
}
```

### 4. 数据验证 (Pydantic vs Zod)

**Python Pydantic**:
```python
# schemas/llm.py
from pydantic import BaseModel, Field
from datetime import datetime

class ProviderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    display_name: str
    base_url: str | None = None
    api_key: str | None = None
    is_active: bool = True

class ProviderResponse(ProviderCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

**TypeScript Zod**:
```typescript
// llm/dto/create-provider.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateProviderSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  isActive: z.boolean().default(true),
});

export class CreateProviderDto extends createZodDto(CreateProviderSchema) {}
export type CreateProviderType = z.infer<typeof CreateProviderSchema>;

// llm/dto/provider-response.dto.ts
export const ProviderResponseSchema = CreateProviderSchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class ProviderResponseDto extends createZodDto(ProviderResponseSchema) {}
```

### 5. ORM 对比 (SQLAlchemy vs Prisma)

**Python SQLAlchemy**:
```python
# models/llm.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Provider(Base):
    __tablename__ = "providers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    base_url = Column(String(500))
    api_key = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    models = relationship("Model", back_populates="provider")
```

**Prisma Schema**:
```prisma
// schema.prisma
model Provider {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  displayName String   @map("display_name") @db.VarChar(100)
  baseUrl     String?  @map("base_url") @db.VarChar(500)
  apiKey      String?  @map("api_key") @db.VarChar(500)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  models Model[]

  @@map("providers")
}
```

### 6. Agent 架构对比

**Python LangChain**:
```python
# agents/script_divider.py
from langchain import LLMChain, PromptTemplate
from langchain_openai import ChatOpenAI
from app.services.llm import ModelResolver

class ScriptDividerAgent:
    def __init__(self, model_resolver: ModelResolver):
        self.model_resolver = model_resolver
        self.prompt = PromptTemplate(
            input_variables=["script_content"],
            template="""请将以下剧本分割成镜头：
            
{script_content}

要求：
1. 每个镜头有明确的场景描述
2. 标注角色对话
3. 输出 JSON 格式
"""
        )
    
    async def divide(self, script_content: str) -> dict:
        model = self.model_resolver.resolve("gpt-4")
        chain = LLMChain(llm=model, prompt=self.prompt)
        result = await chain.ainvoke({"script_content": script_content})
        return self._parse_result(result["text"])
```

**TypeScript LangChain**:
```typescript
// script-processing/agents/script-divider.agent.ts
import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { ModelResolverService } from '../../llm/model-resolver.service';

@Injectable()
export class ScriptDividerAgent {
  private prompt = PromptTemplate.fromTemplate(`
请将以下剧本分割成镜头：

{scriptContent}

要求：
1. 每个镜头有明确的场景描述
2. 标注角色对话
3. 输出 JSON 格式
`);

  constructor(private readonly modelResolver: ModelResolverService) {}

  async divide(scriptContent: string): Promise<ScriptDivisionResult> {
    const model = await this.modelResolver.resolve('gpt-4');
    const chain = new LLMChain({
      llm: model,
      prompt: this.prompt,
    });
    
    const result = await chain.call({ scriptContent });
    return this.parseResult(result.text);
  }
  
  private parseResult(text: string): ScriptDivisionResult {
    // JSON 解析和验证
  }
}
```

### 7. 依赖注入对比

**Python** (使用依赖函数):
```python
# 依赖函数
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 路由中使用
def get_llm_service(db: Session = Depends(get_db)):
    return LLMService(db)

@router.get("/providers")
def list_providers(service: LLMService = Depends(get_llm_service)):
    return service.get_providers()
```

**NestJS** (构造函数注入):
```typescript
// 服务定义
@Injectable()
export class LLMService {
  constructor(private readonly prisma: PrismaService) {}
}

// 控制器使用
@Controller('llm')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}
  
  @Get('providers')
  async findAll() {
    return this.llmService.findAll();
  }
}
```

## 架构模式对比

| 模式 | Python FastAPI | NestJS | 说明 |
|------|----------------|--------|------|
| **依赖注入** | 函数参数 | 构造函数 | NestJS 更完善 |
| **模块化** | 文件组织 | @Module 装饰器 | NestJS 显式声明 |
| **装饰器** | 路由装饰器 | 全功能装饰器 | NestJS 更广泛 |
| **类型系统** | Pydantic | Zod + TypeScript | TS 更严格 |
| **ORM** | SQLAlchemy | Prisma | 各有优势 |
| **AI 框架** | LangChain Python | LangChain JS | API 相似 |
| **测试** | pytest | Vitest | 概念相似 |

## 模块结构对比

```
Python FastAPI:                NestJS:
├── main.py                    ├── main.ts
├── database.py                ├── app.module.ts
├── models/                    ├── prisma/
│   ├── __init__.py            │   └── schema.prisma
│   ├── llm.py                 ├── llm/
│   └── studio.py              │   ├── llm.module.ts
├── schemas/                   │   ├── llm.controller.ts
│   ├── __init__.py            │   ├── llm.service.ts
│   ├── llm.py                 │   └── dto/
│   └── studio.py              ├── studio/
├── services/                  │   ├── studio.module.ts
│   ├── __init__.py            │   ├── studio.controller.ts
│   ├── llm.py                 │   └── studio.service.ts
│   └── studio.py              ├── script-processing/
├── routers/                   │   ├── script-processing.module.ts
│   ├── __init__.py            │   └── agents/
│   ├── llm.py                 └── common/
│   └── studio.py                  ├── filters/
└── agents/                        └── interceptors/
    ├── __init__.py
    └── script_divider.py
```

## 迁移检查清单

- [ ] 将 SQLAlchemy 模型转换为 Prisma Schema
- [ ] 将 Pydantic schemas 转换为 Zod schemas
- [ ] 将服务类转换为 @Injectable() 服务
- [ ] 将路由转换为 @Controller() 控制器
- [ ] 将依赖函数转换为构造函数注入
- [ ] 将 LangChain Python Agent 转换为 TypeScript
- [ ] 将 pytest 测试转换为 Vitest
- [ ] 将 Alembic 迁移转换为 Prisma Migrate

## 参考资源

- [NestJS 文档](https://docs.nestjs.com/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Prisma vs SQLAlchemy](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-sqlalchemy)
