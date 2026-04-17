# 测试策略 - Vitest 配置

## 测试原则

1. **测试先行**: TDD 开发模式，先写测试再实现功能
2. **全面覆盖**: 单元测试、集成测试、E2E 测试全覆盖
3. **行为一致**: NestJS 测试用例与 Python 版本测试预期一致
4. **自动化**: CI/CD 中自动运行测试

## 测试金字塔

```
        /\
       /  \
      /E2E \      <- 少量关键流程测试
     /______\
    /        \
   / Integration\  <- 模块间集成测试
  /______________\
 /                \
/    Unit Tests    \ <- 大量单元测试
/____________________\
```

## 测试配置

### Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/main.ts',
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 测试环境配置

```typescript
// test/setup.ts
import { config } from 'dotenv';

// 加载测试环境变量
config({ path: '.env.test' });

// 全局测试配置
beforeAll(() => {
  // 全局初始化
});

afterAll(async () => {
  // 全局清理
});
```

### 测试数据库配置

```env
# .env.test
DATABASE_URL="file:./test.db"
OPENAI_API_KEY="test-key"
LOG_LEVEL="error"
```

## 单元测试

### 服务层测试

```typescript
// src/llm/llm.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LLMService } from './llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('LLMService', () => {
  let service: LLMService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get(LLMService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('应该返回所有 providers', async () => {
      const mockProviders = [
        { id: 1, name: 'openai', displayName: 'OpenAI' },
      ];
      prisma.provider.findMany.mockResolvedValue(mockProviders);

      const result = await service.findAll();

      expect(result).toEqual(mockProviders);
      expect(prisma.provider.findMany).toHaveBeenCalled();
    });
  });
});
```

### Agent 测试

```typescript
// src/script-processing/agents/script-divider.agent.spec.ts
import { ScriptDividerAgent } from './script-divider.agent';
import { ModelResolverService } from '../../llm/model-resolver.service';

describe('ScriptDividerAgent', () => {
  let agent: ScriptDividerAgent;
  let modelResolver: jest.Mocked<ModelResolverService>;

  beforeEach(() => {
    modelResolver = {
      resolve: jest.fn(),
    } as any;
    agent = new ScriptDividerAgent(modelResolver);
  });

  describe('divide', () => {
    it('应该成功分割剧本', async () => {
      const scriptContent = '场景一：这是一个测试剧本';
      const mockModel = {
        invoke: jest.fn().mockResolvedValue({
          text: JSON.stringify({
            shots: [{ shotNumber: '1.1', content: '镜头内容' }],
          }),
        }),
      };
      modelResolver.resolve.mockResolvedValue(mockModel as any);

      const result = await agent.divide(scriptContent);

      expect(result.shots).toHaveLength(1);
      expect(result.shots[0].shotNumber).toBe('1.1');
    });
  });
});
```

## 集成测试

### API 端点测试

```typescript
// test/llm.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('LLMController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // 清理并准备测试数据
    await prisma.provider.deleteMany();
    await prisma.provider.create({
      data: { name: 'openai', displayName: 'OpenAI' },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /llm/providers 应该返回 provider 列表', async () => {
    const response = await request(app.getHttpServer())
      .get('/llm/providers')
      .expect(200);

    expect(response.body.code).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

## E2E 测试

### 完整工作流测试

```typescript
// test/script-processing.e2e-spec.ts
describe('Script Processing Workflow (e2e)', () => {
  it('应该完成完整的剧本处理流程', async () => {
    // 1. 创建项目
    const projectResponse = await request(app.getHttpServer())
      .post('/studio/projects')
      .send({ title: '测试剧本' })
      .expect(201);

    const projectId = projectResponse.body.data.id;

    // 2. 创建章节
    const chapterResponse = await request(app.getHttpServer())
      .post(`/studio/projects/${projectId}/chapters`)
      .send({
        chapterNumber: 1,
        title: '第一章',
        content: '场景一：主角登场...',
      })
      .expect(201);

    const chapterId = chapterResponse.body.data.id;

    // 3. 调用剧本分割
    const divideResponse = await request(app.getHttpServer())
      .post('/script-processing/divide')
      .send({ chapterId, content: '场景一：主角登场...' })
      .expect(200);

    expect(divideResponse.body.data.shots).toBeDefined();
  });
});
```

## 测试命令

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行 E2E 测试
npm run test:e2e

# 生成覆盖率报告
npm run test:cov

# 监视模式
npm run test:watch
```

## 覆盖率要求

| 模块 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|----------|------------|------------|
| LLM 管理 | >= 85% | >= 80% | >= 90% |
| Studio | >= 80% | >= 75% | >= 85% |
| Script Processing | >= 85% | >= 80% | >= 90% |
| Film | >= 80% | >= 75% | >= 85% |
| 整体 | >= 80% | >= 75% | >= 85% |
