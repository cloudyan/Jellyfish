# 数据库设计 - Prisma Schema

## Schema 设计原则

1. **与 Python 版本兼容**: 数据模型与 SQLAlchemy 定义保持一致
2. **类型安全**: 充分利用 Prisma 的类型系统
3. **关系清晰**: 明确定义模型间的关系和外键约束
4. **可扩展性**: 预留扩展字段，支持未来功能

## 数据库选型

### 开发环境: SQLite
```prisma
// 开发配置
DATABASE_URL="file:./dev.db"
```

### 生产环境: PostgreSQL
```prisma
// 生产配置
DATABASE_URL="postgresql://user:password@localhost:5432/jellyfish"
```

## 核心模型定义

### 1. 基础约定

#### 关于继承
Prisma **不支持模型继承**，因此无法像 Python SQLAlchemy 那样使用 `TimestampMixin`。我们需要在每个模型中手动重复添加 `created_at` 和 `updated_at` 字段。

#### ID 类型约定
所有模型统一使用 `cuid()` 作为主键 ID，保持一致性：

```prisma
id String @id @default(cuid())
```

#### 时间戳字段约定
所有模型都包含以下两个时间戳字段：

```prisma
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

### 2. LLM 管理模块

#### Provider
```prisma
model Provider {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String   @map("display_name")
  baseUrl     String?  @map("base_url")
  apiKey      String?  @map("api_key") // 加密存储
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  models Model[]

  @@map("providers")
}
```

#### Model
```prisma
model Model {
  id          String   @id @default(cuid())
  providerId  String   @map("provider_id")
  modelId     String   @map("model_id") // 如: gpt-4, claude-3-opus
  displayName String   @map("display_name")
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  category    ModelCategoryKey? @map("category")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  provider      Provider       @relation(fields: [providerId], references: [id])
  modelSettings ModelSetting[]

  @@unique([providerId, modelId])
  @@map("models")
}
```

enum ModelCategoryKey {
  TEXT
  IMAGE
  VIDEO
  AUDIO

  @@map("model_category_key")
}
```

#### ModelSetting
```prisma
model ModelSetting {
  id           String   @id @default(cuid())
  modelId      String   @map("model_id")
  temperature  Float    @default(0.7)
  maxTokens    Int?     @map("max_tokens")
  topP         Float?   @map("top_p")
  frequencyPenalty Float? @map("frequency_penalty")
  presencePenalty  Float? @map("presence_penalty")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  model Model @relation(fields: [modelId], references: [id])

  @@map("model_settings")
}
```

### 3. Studio 核心模块

#### Project
```prisma
model Project {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      ProjectStatus @default(DRAFT)
  coverImage  String?  @map("cover_image")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  chapters  Chapter[]
  characters Character[]
  actors     Actor[] @relation("ProjectActorLink")
  scenes     Scene[] @relation("ProjectSceneLink")
  props      Prop[] @relation("ProjectPropLink")
  costumes   Costume[] @relation("ProjectCostumeLink")

  @@map("projects")
}
```

#### Chapter
```prisma
model Chapter {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  chapterNumber Int    @map("chapter_number")
  title       String?
  content     String?  @db.Text
  status      ChapterStatus @default(DRAFT)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id])
  shots   Shot[]

  @@unique([projectId, chapterNumber])
  @@map("chapters")
}
```

#### Shot
```prisma
model Shot {
  id          String   @id @default(cuid())
  chapterId   String   @map("chapter_id")
  shotNumber  String   @map("shot_number") // 如: 1.1, 1.2
  content     String?  @db.Text
  sceneId     String?  @map("scene_id")
  status      ShotStatus @default(DRAFT)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  chapter    Chapter             @relation(fields: [chapterId], references: [id])
  scene      Scene?              @relation(fields: [sceneId], references: [id])
  detail     ShotDetail?
  dialogLines ShotDialogLine[]
  frameImages ShotFrameImage[]
  candidates ShotExtractedCandidate[]

  @@unique([chapterId, shotNumber])
  @@map("shots")
}
```

#### ShotDetail
```prisma
model ShotDetail {
  id              String  @id @default(cuid())
  shotId          String  @unique @map("shot_id")
  sceneTitle      String? @map("scene_title")
  sceneType       String? @map("scene_type")
  timeLocation    String? @map("time_location")
  atmosphere      String?
  cameraMovement  String? @map("camera_movement")
  cameraAngle     String? @map("camera_angle")
  lensInfo        String? @map("lens_info")
  visualEffects   String? @map("visual_effects") @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  shot Shot @relation(fields: [shotId], references: [id])

  @@map("shot_details")
}
```

#### ShotDialogLine
```prisma
model ShotDialogLine {
  id          String  @id @default(cuid())
  shotId      String  @map("shot_id")
  characterId String? @map("character_id")
  lineNumber  Int     @map("line_number")
  content     String  @db.Text
  emotion     String?
  action      String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  shot      Shot      @relation(fields: [shotId], references: [id])
  character Character? @relation(fields: [characterId], references: [id])

  @@map("shot_dialog_lines")
}
```

### 4. 资产模型

#### Character
```prisma
model Character {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  name        String
  description String?  @db.Text
  personality String?  @db.Text
  appearance  String?  @db.Text // JSON 格式
  actorId     String?  @map("actor_id")
  costumeId   String?  @map("costume_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project     Project          @relation(fields: [projectId], references: [id])
  actor       Actor?           @relation(fields: [actorId], references: [id])
  costume     Costume?         @relation(fields: [costumeId], references: [id])
  dialogLines ShotDialogLine[]
  images      CharacterImage[]

  @@map("characters")
}
```

#### Actor
```prisma
model Actor {
  id          String   @id @default(cuid())
  name        String
  description String?
  avatarUrl   String?  @map("avatar_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  characters Character[]
  projects   Project[] @relation("ProjectActorLink")

  @@map("actors")
}
```

#### Scene
```prisma
model Scene {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  name        String
  description String?  @db.Text
  location    String?
  timeOfDay   String?  @map("time_of_day")
  props       String?  // JSON 格式
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id])
  projects Project[] @relation("ProjectSceneLink")
  shots   Shot[]

  @@map("scenes")
}
```

#### Prop
```prisma
model Prop {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  type        String?  // 道具类型: 武器, 家具, 装饰品等
  imageUrl    String?  @map("image_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  projects Project[] @relation("ProjectPropLink")

  @@map("props")
}
```

#### Costume
```prisma
model Costume {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  style       String?  // 服装风格
  imageUrl    String?  @map("image_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  characters Character[]
  projects   Project[] @relation("ProjectCostumeLink")

  @@map("costumes")
}
```

#### ShotExtractedCandidate
```prisma
model ShotExtractedCandidate {
  id          String   @id @default(cuid())
  shotId      String   @map("shot_id")
  entityType  String   @map("entity_type") // character, prop, scene, costume
  entityName  String   @map("entity_name")
  confidence  Float    // 置信度 0-1
  isSelected  Boolean  @default(false) @map("is_selected")
  metadata    String?  // JSON 格式，提取的额外信息
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  shot Shot @relation(fields: [shotId], references: [id])

  @@map("shot_extracted_candidates")
}
```

### 5. 多对多关联表

#### ProjectActorLink
```prisma
model ProjectActorLink {
  projectId String @map("project_id")
  actorId   String @map("actor_id")
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation("ProjectActorLink", fields: [projectId], references: [id])
  actor   Actor   @relation("ProjectActorLink", fields: [actorId], references: [id])

  @@id([projectId, actorId])
  @@map("project_actor_links")
}
```

#### ProjectSceneLink
```prisma
model ProjectSceneLink {
  projectId String @map("project_id")
  sceneId   String @map("scene_id")
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation("ProjectSceneLink", fields: [projectId], references: [id])
  scene   Scene   @relation("ProjectSceneLink", fields: [sceneId], references: [id])

  @@id([projectId, sceneId])
  @@map("project_scene_links")
}
```

#### ProjectPropLink
```prisma
model ProjectPropLink {
  projectId String @map("project_id")
  propId    String @map("prop_id")
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation("ProjectPropLink", fields: [projectId], references: [id])
  prop    Prop    @relation("ProjectPropLink", fields: [propId], references: [id])

  @@id([projectId, propId])
  @@map("project_prop_links")
}
```

#### ProjectCostumeLink
```prisma
model ProjectCostumeLink {
  projectId  String  @map("project_id")
  costumeId  String  @map("costume_id")
  createdAt  DateTime @default(now()) @map("created_at")

  project Project  @relation("ProjectCostumeLink", fields: [projectId], references: [id])
  costume Costume  @relation("ProjectCostumeLink", fields: [costumeId], references: [id])

  @@id([projectId, costumeId])
  @@map("project_costume_links")
}
```

### 6. 文件与任务

#### AssetImage
```prisma
model AssetImage {
  id          String   @id @default(cuid())
  entityType  String   @map("entity_type") // character, scene, prop, etc.
  entityId    String   @map("entity_id")
  imageType   String   @map("image_type") // portrait, full_body, etc.
  imageUrl    String   @map("image_url")
  prompt      String?  @db.Text
  isPrimary   Boolean  @default(false) @map("is_primary")
  metadata    String?  // JSON 格式
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([entityType, entityId])
  @@map("asset_images")
}
```

#### CharacterImage
```prisma
model CharacterImage {
  id          String   @id @default(cuid())
  characterId String   @map("character_id")
  imageUrl    String   @map("image_url")
  prompt      String?  @db.Text
  imageType   String   @default("portrait") @map("image_type")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  character Character @relation(fields: [characterId], references: [id])

  @@map("character_images")
}
```

#### ShotFrameImage
```prisma
model ShotFrameImage {
  id          String   @id @default(cuid())
  shotId      String   @map("shot_id")
  imageUrl    String   @map("image_url")
  prompt      String?  @db.Text
  frameIndex  Int      @map("frame_index")
  isPrimary   Boolean  @default(false) @map("is_primary")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  shot Shot @relation(fields: [shotId], references: [id])

  @@map("shot_frame_images")
}
```

#### FileUsage
```prisma
model FileUsage {
  id          String   @id @default(cuid())
  filePath    String   @map("file_path")
  entityType  String   @map("entity_type") // project, shot, prompt, etc.
  entityId    String   @map("entity_id")
  usageType   String   @map("usage_type") // input, output, reference
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([entityType, entityId])
  @@index([filePath])
  @@map("studio_file_usages")
}
```

#### Task
```prisma
model Task {
  id          String   @id @default(cuid())
  name        String
  type        TaskType
  status      TaskStatus @default(PENDING)
  inputData   String?   @map("input_data") @db.Text
  outputData  String?   @map("output_data") @db.Text
  errorMessage String?  @map("error_message")
  startedAt   DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  taskLinks TaskLink[]

  @@map("tasks")
}
```

#### TaskLink
```prisma
model TaskLink {
  id          String  @id @default(cuid())
  taskId      String  @map("task_id")
  entityType  String  @map("entity_type") // project, chapter, shot, etc.
  entityId    String  @map("entity_id")
  createdAt   DateTime @default(now()) @map("created_at")

  task Task @relation(fields: [taskId], references: [id])

  @@unique([taskId, entityType, entityId])
  @@map("task_links")
}
```

### 7. 提示词与时间线

#### PromptTemplate
```prisma
model PromptTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  agentType   String   @map("agent_type") // script_divider, extractor, etc.
  systemPrompt String  @map("system_prompt") @db.Text
  userPrompt  String   @map("user_prompt") @db.Text
  variables   String?  // JSON 格式，变量定义
  modelSettings String? @map("model_settings") // JSON 格式
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("prompt_templates")
}
```

#### PromptFile
```prisma
model PromptFile {
  id          String   @id @default(cuid())
  name        String
  description String?
  content     String   @db.Text
  fileType    String   @map("file_type") // txt, md, json
  version     Int      @default(1)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("prompt_files")
}
```

#### StudioTimeline
```prisma
model StudioTimeline {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  name        String   // 时间线名称
  description String?
  order       Int      @default(0) // 排序
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project     Project                 @relation(fields: [projectId], references: [id])
  promptFiles StudioPromptFilesTimeline[]

  @@map("studio_timeline")
}
```

#### StudioPromptFilesTimeline
```prisma
model StudioPromptFilesTimeline {
  id            String   @id @default(cuid())
  timelineId    String   @map("timeline_id")
  promptFileId  String   @map("prompt_file_id")
  order         Int      @default(0) @map("order")
  enabled       Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  timeline    StudioTimeline  @relation(fields: [timelineId], references: [id])
  promptFile  PromptFile      @relation(fields: [promptFileId], references: [id])

  @@map("studio_prompts_files_timeline")
}
```

## 索引设计

### 性能优化索引

```prisma
// Shot 查询优化
@@index([chapterId, shotNumber])
@@index([status])

// DialogLine 查询优化
@@index([shotId, lineNumber])

// Task 查询优化
@@index([status, type])
@@index([createdAt])

// AssetImage 查询优化
@@index([entityType, entityId])
@@index([isPrimary])
```

## 数据迁移策略

### 1. 自动迁移 (开发环境)
```bash
npx prisma migrate dev --name init
```

### 2. 生产迁移
```bash
npx prisma migrate deploy
```

### 3. 数据种子
```prisma
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 种子数据
  await prisma.provider.create({
    data: {
      name: 'openai',
      displayName: 'OpenAI',
    }
  });
}

main();
```

## 完整表清单

总计 **27** 张表：

| 序号 | 模型名 | 表名 | 说明 |
|------|--------|------|------|
| 1 | Provider | `providers` | LLM 提供商 |
| 2 | Model | `models` | LLM 模型 |
| 3 | ModelSetting | `model_settings` | 模型设置 |
| 4 | Project | `projects` | 项目 |
| 5 | Chapter | `chapters` | 章节 |
| 6 | Shot | `shots` | 镜头 |
| 7 | ShotDetail | `shot_details` | 镜头详情 |
| 8 | ShotDialogLine | `shot_dialog_lines` | 镜头对白 |
| 9 | Character | `characters` | 角色 |
| 10 | Actor | `actors` | 演员 |
| 11 | Scene | `scenes` | 场景 |
| 12 | Prop | `props` | 道具 |
| 13 | Costume | `costumes` | 服装 |
| 14 | ShotExtractedCandidate | `shot_extracted_candidates` | 镜头提取候选实体 |
| 15 | ProjectActorLink | `project_actor_links` | 项目-演员多对多 |
| 16 | ProjectSceneLink | `project_scene_links` | 项目-场景多对多 |
| 17 | ProjectPropLink | `project_prop_links` | 项目-道具多对多 |
| 18 | ProjectCostumeLink | `project_costume_links` | 项目-服装多对多 |
| 19 | AssetImage | `asset_images` | 通用资产图片 |
| 20 | CharacterImage | `character_images` | 角色图片 |
| 21 | ShotFrameImage | `shot_frame_images` | 镜头分镜图片 |
| 22 | FileUsage | `studio_file_usages` | 文件使用记录 |
| 23 | Task | `tasks` | 任务 |
| 24 | TaskLink | `task_links` | 任务关联 |
| 25 | PromptTemplate | `prompt_templates` | 提示词模板 |
| 26 | PromptFile | `prompt_files` | 提示词文件 |
| 27 | StudioTimeline | `studio_timeline` | 工作室时间线 |
| 28 | StudioPromptFilesTimeline | `studio_prompts_files_timeline` | 时间线提示词文件关联 |

> 注：实际共计 28 张表，包含完整的数据模型。

## 与 Python SQLAlchemy 的差异

| 特性 | SQLAlchemy | Prisma | 说明 |
|------|------------|--------|------|
| 定义方式 | Python 类 | Schema 文件 | 语法不同，概念相似 |
| 关系定义 | relationship() | @relation | 语法差异 |
| 迁移 | Alembic | Prisma Migrate | 后者更自动化 |
| 查询 | Query API | Prisma Client | 风格不同 |
| 类型生成 | 手动 | 自动生成 | Prisma 更优 |

## 参考

- [Prisma Schema 文档](https://www.prisma.io/docs/orm/prisma-schema)
- [Prisma Migrate 文档](https://www.prisma.io/docs/orm/prisma-migrate)
- [Prisma Client API](https://www.prisma.io/docs/orm/reference/prisma-client-reference)
