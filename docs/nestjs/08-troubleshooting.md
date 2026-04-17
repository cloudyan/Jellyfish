# 问题排查指南

## 常见问题与解决方案

### 1. Prisma 相关问题

#### 问题: Prisma Client 未生成
```
Error: @prisma/client did not initialize yet
```

**解决方案**:
```bash
# 重新生成 Prisma Client
npx prisma generate

# 如果 schema 有变更，先执行迁移
npx prisma migrate dev
```

#### 问题: 数据库连接失败
```
Error: Can't reach database server
```

**解决方案**:
1. 检查 `.env` 中的 `DATABASE_URL`
2. 确保数据库服务已启动
3. 检查连接字符串格式

```bash
# SQLite
DATABASE_URL="file:./dev.db"

# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/jellyfish"
```

#### 问题: 迁移锁冲突
```
Error: P1005: Database migration is locked
```

**解决方案**:
```bash
# 解除迁移锁
npx prisma migrate resolve --rolled-back "migration_name"

# 或删除迁移锁（开发环境）
rm prisma/migrations/migration_lock.toml
```

### 2. LangChain 相关问题

#### 问题: API Key 未设置
```
Error: OPENAI_API_KEY is not set
```

**解决方案**:
```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env
OPENAI_API_KEY="sk-..."
```

#### 问题: LangGraph 状态类型错误
```
TypeError: Cannot read property 'shots' of undefined
```

**解决方案**:
```typescript
// 确保 State 有默认值
interface ScriptState {
  shots?: ShotData[];  // 使用可选类型
  entities?: EntityData;
}

// 或使用默认值函数
const graph = new StateGraph<ScriptState>({
  channels: {
    shots: {
      value: (x, y) => y ?? x,
      default: () => [],  // 提供默认值
    },
  },
});
```

#### 问题: LLM 调用超时
```
Error: Request timed out
```

**解决方案**:
```typescript
const model = new ChatOpenAI({
  modelName: 'gpt-4',
  timeout: 60000,  // 60 秒超时
  maxRetries: 3,   // 重试次数
});
```

### 3. NestJS 相关问题

#### 问题: 模块依赖循环
```
Error: Cannot resolve dependency
```

**解决方案**:
```typescript
// 使用 forwardRef 解决循环依赖
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => StudioModule),
  ],
})
export class ScriptProcessingModule {}
```

#### 问题: 全局守卫未生效
```
Error: Unauthorized (guard not applied)
```

**解决方案**:
```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(new ValidationPipe());
app.useGlobalGuards(new JwtAuthGuard());
```

#### 问题: Swagger 文档未生成
```
Error: Cannot read swagger config
```

**解决方案**:
```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Jellyfish API')
  .setVersion('0.1.0')
  .addBearerAuth()  // 添加认证
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

### 4. Zod 验证问题

#### 问题: 验证错误格式不一致
```
Validation failed: expected string, received number
```

**解决方案**:
```typescript
// 使用全局异常过滤器统一错误格式
@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const errors = exception.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: errors,
      },
    });
  }
}
```

#### 问题: 日期类型验证失败
```
Error: Invalid date format
```

**解决方案**:
```typescript
// 使用预处理转换日期
const DateSchema = z.preprocess(
  (val) => (typeof val === 'string' ? new Date(val) : val),
  z.date()
);

// 或在 DTO 中使用 Transform
class CreateDto extends createZodDto(CreateSchema) {
  @Transform(({ value }) => new Date(value))
  dateField: Date;
}
```

### 5. 测试相关问题

#### 问题: 测试数据库未隔离
```
Error: Duplicate entry in test
```

**解决方案**:
```typescript
// test/setup.ts
beforeEach(async () => {
  // 每次测试前清理数据库
  await prisma.$transaction([
    prisma.shot.deleteMany(),
    prisma.chapter.deleteMany(),
    prisma.project.deleteMany(),
  ]);
});
```

#### 问题: Mock 未生效
```
Error: Actual implementation called instead of mock
```

**解决方案**:
```typescript
// 在测试模块中正确配置 Provider
const module = await Test.createTestingModule({
  providers: [
    {
      provide: LLMService,
      useValue: {
        generate: jest.fn().mockResolvedValue({ text: 'mocked' }),
      },
    },
  ],
}).compile();
```

#### 问题: 异步测试超时
```
Error: Test timeout exceeded
```

**解决方案**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000,  // 30 秒
    hookTimeout: 30000,
  },
});
```

### 6. 性能问题

#### 问题: 数据库查询 N+1
```
Slow query detected: N+1 query problem
```

**解决方案**:
```typescript
// 使用 include 预加载关联数据
const projects = await prisma.project.findMany({
  include: {
    chapters: {
      include: {
        shots: true,
      },
    },
  },
});

// 或使用 select 只查询需要的字段
const projects = await prisma.project.findMany({
  select: {
    id: true,
    title: true,
    chapters: {
      select: {
        id: true,
        title: true,
      },
    },
  },
});
```

#### 问题: LLM 调用过多
```
Rate limit exceeded
```

**解决方案**:
```typescript
// 实现缓存
@Injectable()
export class LLMService {
  private cache = new Map<string, any>();

  async generate(key: string, prompt: string) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = await this.llm.invoke(prompt);
    this.cache.set(key, result);
    return result;
  }
}
```

### 7. 环境配置问题

#### 问题: 环境变量未加载
```
Error: process.env.XXX is undefined
```

**解决方案**:
```typescript
// 确保在 main.ts 顶部加载
import { config } from 'dotenv';
config();

// 或使用 ConfigModule
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
});
```

#### 问题: 端口被占用
```
Error: EADDRINUSE: address already in use :::8000
```

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :8000

# 终止进程
kill -9 <PID>

# 或使用不同端口
npm run start:dev -- --port 8001
```

## 调试技巧

### 1. Prisma 查询日志

```typescript
// 启用查询日志
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### 2. LangChain 调试

```typescript
// 启用详细日志
import { setGlobalHandler } from '@langchain/core/tracers/log_stream';

const chain = prompt.pipe(model).pipe(outputParser);
const result = await chain.invoke(input, { 
  callbacks: [new ConsoleCallbackHandler()] 
});
```

### 3. NestJS 调试

```typescript
// 启用详细日志
const app = await NestFactory.create(AppModule, {
  logger: ['log', 'error', 'warn', 'debug', 'verbose'],
});
```

### 4. VS Code 调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 错误码参考

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| P1001 | 无法连接数据库 | 检查数据库配置 |
| P2002 | 唯一约束冲突 | 检查重复数据 |
| P2025 | 记录未找到 | 检查 ID 是否正确 |
| P3005 | 迁移失败 | 检查迁移文件 |
| VALIDATION_ERROR | 参数验证失败 | 检查请求参数 |
| AUTH_ERROR | 认证失败 | 检查 Token |
| RATE_LIMIT | 限流 | 降低请求频率 |

## 获取帮助

1. **查看日志**: `npm run start:dev` 中的详细错误信息
2. **检查文档**: 
   - [NestJS 文档](https://docs.nestjs.com/)
   - [Prisma 文档](https://www.prisma.io/docs)
   - [LangChain 文档](https://js.langchain.com/)
3. **搜索 Issue**: GitHub 上的相关问题和解决方案
4. **社区支持**: Discord、Stack Overflow

## 迁移特定问题

### Python 与 TypeScript 差异导致的问题

| Python 行为 | TypeScript 差异 | 解决方案 |
|-------------|-----------------|----------|
| 动态类型 | 静态类型 | 严格配置 tsconfig.json |
| None | null/undefined | 使用可选类型 `?` |
| List/Dict | Array/Object | 使用 Array<> 和 Record<> |
| datetime | Date | 使用 z.preprocess 转换 |
| kwargs | 剩余参数 | 使用 `...rest` 语法 |
