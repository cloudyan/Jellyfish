# Agent 迁移示例

本文档展示如何将 Python LangChain Agent 迁移到 TypeScript NestJS。

## 1. ScriptDividerAgent 迁移

### Python 版本

```python
# agents/script_divider.py
from typing import List, Dict, Any
from langchain import LLMChain, PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from app.services.llm import ModelResolver

class ShotData(BaseModel):
    shot_number: str = Field(description="镜头编号，如 1.1")
    content: str = Field(description="镜头内容描述")
    scene_description: str = Field(description="场景描述")
    dialog_lines: List[Dict[str, str]] = Field(default=[], description="对话列表")

class ScriptDivisionResult(BaseModel):
    shots: List[ShotData] = Field(description="镜头列表")

class ScriptDividerAgent:
    """剧本分割 Agent"""
    
    def __init__(self, model_resolver: ModelResolver):
        self.model_resolver = model_resolver
        self.parser = PydanticOutputParser(pydantic_object=ScriptDivisionResult)
        
        self.prompt = PromptTemplate(
            template="""你是一个专业的剧本分析师。请将以下剧本内容分割成独立的镜头。

剧本内容：
{script_content}

要求：
1. 每个镜头应该有明确的编号（如 1.1, 1.2）
2. 描述镜头的主要内容和场景
3. 提取角色的对话（如果有）
4. 输出必须是有效的 JSON 格式

{format_instructions}
""",
            input_variables=["script_content"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
    
    async def divide(self, script_content: str, model_id: str = "gpt-4") -> ScriptDivisionResult:
        """分割剧本"""
        # 获取 LLM 实例
        model = await self.model_resolver.resolve(model_id)
        
        # 创建 Chain
        chain = LLMChain(llm=model, prompt=self.prompt)
        
        # 执行
        result = await chain.ainvoke({"script_content": script_content})
        
        # 解析输出
        try:
            parsed = self.parser.parse(result["text"])
            return parsed
        except Exception as e:
            # 尝试修复 JSON
            fixed = self._try_fix_json(result["text"])
            if fixed:
                return self.parser.parse(fixed)
            raise ValueError(f"无法解析 LLM 输出: {e}")
    
    def _try_fix_json(self, text: str) -> str | None:
        """尝试修复不完整的 JSON"""
        # 提取 JSON 部分
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group()
        return None
```

### TypeScript/NestJS 版本

```typescript
// script-processing/agents/script-divider.agent.ts
import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { z } from 'zod';
import { ModelResolverService } from '../../llm/model-resolver.service';

// 定义输出 Schema
const ShotDataSchema = z.object({
  shotNumber: z.string().describe('镜头编号，如 1.1'),
  content: z.string().describe('镜头内容描述'),
  sceneDescription: z.string().describe('场景描述'),
  dialogLines: z.array(
    z.object({
      character: z.string(),
      content: z.string(),
    })
  ).optional().describe('对话列表'),
});

const ScriptDivisionResultSchema = z.object({
  shots: z.array(ShotDataSchema).describe('镜头列表'),
});

export type ShotData = z.infer<typeof ShotDataSchema>;
export type ScriptDivisionResult = z.infer<typeof ScriptDivisionResultSchema>;

@Injectable()
export class ScriptDividerAgent {
  private readonly logger = new Logger(ScriptDividerAgent.name);
  
  private readonly prompt: PromptTemplate;

  constructor(private readonly modelResolver: ModelResolverService) {
    this.prompt = PromptTemplate.fromTemplate(`
你是一个专业的剧本分析师。请将以下剧本内容分割成独立的镜头。

剧本内容：
{scriptContent}

要求：
1. 每个镜头应该有明确的编号（如 1.1, 1.2）
2. 描述镜头的主要内容和场景
3. 提取角色的对话（如果有）
4. 输出必须是有效的 JSON 格式，符合以下结构：

{formatInstructions}

请只返回 JSON，不要包含其他解释文字。
`);
  }

  async divide(
    scriptContent: string, 
    modelId: string = 'gpt-4'
  ): Promise<ScriptDivisionResult> {
    this.logger.debug(`开始分割剧本，使用模型: ${modelId}`);

    try {
      // 获取 LLM 实例
      const model = await this.modelResolver.resolve(modelId);
      
      // 生成格式说明
      const formatInstructions = this.generateFormatInstructions();
      
      // 创建 Chain
      const chain = new LLMChain({
        llm: model,
        prompt: this.prompt,
      });
      
      // 执行
      const result = await chain.call({
        scriptContent,
        formatInstructions,
      });

      this.logger.debug('LLM 返回结果', result.text);

      // 解析输出
      return this.parseResult(result.text);
      
    } catch (error) {
      this.logger.error('剧本分割失败', error.stack);
      throw new Error(`剧本分割失败: ${error.message}`);
    }
  }

  private generateFormatInstructions(): string {
    return JSON.stringify({
      shots: [
        {
          shotNumber: '1.1',
          content: '镜头内容描述',
          sceneDescription: '场景描述',
          dialogLines: [
            { character: '角色名', content: '对话内容' }
          ]
        }
      ]
    }, null, 2);
  }

  private parseResult(text: string): ScriptDivisionResult {
    try {
      // 尝试直接解析
      const json = this.extractJson(text);
      const parsed = ScriptDivisionResultSchema.parse(json);
      return parsed;
    } catch (error) {
      this.logger.warn('直接解析失败，尝试修复', error.message);
      
      // 尝试修复 JSON
      const fixed = this.tryFixJson(text);
      if (fixed) {
        return ScriptDivisionResultSchema.parse(fixed);
      }
      
      throw new Error(`无法解析 LLM 输出: ${error.message}`);
    }
  }

  private extractJson(text: string): unknown {
    // 查找 JSON 代码块
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }
    
    // 查找普通 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // 尝试直接解析
    return JSON.parse(text);
  }

  private tryFixJson(text: string): unknown | null {
    try {
      // 尝试补全不完整的 JSON
      let fixed = text.trim();
      
      // 添加缺失的闭合括号
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        fixed += '}'.repeat(openBraces - closeBraces);
      }
      
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        fixed += ']'.repeat(openBrackets - closeBrackets);
      }
      
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}
```

## 2. ElementExtractorAgent 迁移

### Python 版本

```python
# agents/element_extractor.py
from typing import List, Dict
from pydantic import BaseModel, Field
from langchain import LLMChain, PromptTemplate
from app.services.llm import ModelResolver

class ExtractedCharacter(BaseModel):
    name: str
    aliases: List[str] = []
    description: str = ""

class ExtractedScene(BaseModel):
    name: str
    location: str = ""
    time_of_day: str = ""

class ElementExtractionResult(BaseModel):
    characters: List[ExtractedCharacter] = []
    scenes: List[ExtractedScene] = []

class ElementExtractorAgent:
    """元素提取 Agent"""
    
    def __init__(self, model_resolver: ModelResolver):
        self.model_resolver = model_resolver
        
    async def extract(
        self, 
        script_content: str, 
        extraction_types: List[str],
        model_id: str = "gpt-4"
    ) -> ElementExtractionResult:
        model = await self.model_resolver.resolve(model_id)
        
        # 根据提取类型动态生成提示词
        prompt = self._build_prompt(extraction_types)
        chain = LLMChain(llm=model, prompt=prompt)
        
        result = await chain.ainvoke({"script_content": script_content})
        return self._parse_result(result["text"])
    
    def _build_prompt(self, extraction_types: List[str]) -> PromptTemplate:
        # 动态构建提示词
        pass
```

### TypeScript/NestJS 版本

```typescript
// script-processing/agents/element-extractor.agent.ts
import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { z } from 'zod';
import { ModelResolverService } from '../../llm/model-resolver.service';

// 定义提取结果 Schema
const ExtractedCharacterSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  description: z.string().default(''),
});

const ExtractedSceneSchema = z.object({
  name: z.string(),
  location: z.string().default(''),
  timeOfDay: z.string().default(''),
});

const ElementExtractionResultSchema = z.object({
  characters: z.array(ExtractedCharacterSchema).default([]),
  scenes: z.array(ExtractedSceneSchema).default([]),
});

export type ExtractedCharacter = z.infer<typeof ExtractedCharacterSchema>;
export type ExtractedScene = z.infer<typeof ExtractedSceneSchema>;
export type ElementExtractionResult = z.infer<typeof ElementExtractionResultSchema>;

export type ExtractionType = 'characters' | 'scenes' | 'props' | 'costumes';

@Injectable()
export class ElementExtractorAgent {
  private readonly logger = new Logger(ElementExtractorAgent.name);

  private readonly basePrompt = `
请从以下剧本内容中提取指定类型的元素。

剧本内容：
{scriptContent}

需要提取的类型：{extractionTypes}

请返回 JSON 格式：
{formatInstructions}
`;

  constructor(private readonly modelResolver: ModelResolverService) {}

  async extract(
    scriptContent: string,
    extractionTypes: ExtractionType[],
    modelId: string = 'gpt-4',
  ): Promise<ElementExtractionResult> {
    this.logger.debug(`开始提取元素: ${extractionTypes.join(', ')}`);

    const model = await this.modelResolver.resolve(modelId);
    const prompt = this.buildPrompt(extractionTypes);
    const chain = new LLMChain({ llm: model, prompt });

    const result = await chain.call({
      scriptContent,
      extractionTypes: extractionTypes.join(', '),
      formatInstructions: this.getFormatInstructions(),
    });

    return this.parseResult(result.text);
  }

  private buildPrompt(extractionTypes: ExtractionType[]): PromptTemplate {
    // 根据提取类型动态调整提示词
    let typeSpecificInstructions = '';
    
    if (extractionTypes.includes('characters')) {
      typeSpecificInstructions += `
角色提取要求：
- 识别所有出现的角色名称
- 收集角色的别名、绰号
- 描述角色的外貌特征和性格
`;
    }
    
    if (extractionTypes.includes('scenes')) {
      typeSpecificInstructions += `
场景提取要求：
- 识别场景名称和地点
- 标注时间段（如早晨、夜晚）
- 描述场景氛围
`;
    }

    const template = this.basePrompt + typeSpecificInstructions;
    return PromptTemplate.fromTemplate(template);
  }

  private getFormatInstructions(): string {
    return JSON.stringify({
      characters: [
        {
          name: '角色名称',
          aliases: ['别名1', '别名2'],
          description: '角色描述'
        }
      ],
      scenes: [
        {
          name: '场景名称',
          location: '地点',
          timeOfDay: '时间段'
        }
      ]
    }, null, 2);
  }

  private parseResult(text: string): ElementExtractionResult {
    try {
      const json = this.extractJson(text);
      return ElementExtractionResultSchema.parse(json);
    } catch (error) {
      this.logger.error('解析提取结果失败', error);
      throw new Error(`元素提取结果解析失败: ${error.message}`);
    }
  }

  private extractJson(text: string): unknown {
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(text);
  }
}
```

## 3. LangGraph 工作流编排

### Python 版本

```python
# chains/script_processing.py
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class ScriptState(TypedDict):
    script_content: str
    chapter_id: int
    shots: list
    entities: dict
    consistency_issues: list

class ScriptProcessingChain:
    def __init__(
        self,
        divider_agent: ScriptDividerAgent,
        extractor_agent: ElementExtractorAgent,
        consistency_agent: ConsistencyCheckerAgent
    ):
        self.divider = divider_agent
        self.extractor = extractor_agent
        self.consistency = consistency_agent
        
    def build_graph(self):
        workflow = StateGraph(ScriptState)
        
        # 添加节点
        workflow.add_node("divide", self.divide_step)
        workflow.add_node("extract", self.extract_step)
        workflow.add_node("check_consistency", self.check_consistency_step)
        
        # 添加边
        workflow.set_entry_point("divide")
        workflow.add_edge("divide", "extract")
        workflow.add_edge("extract", "check_consistency")
        workflow.add_edge("check_consistency", END)
        
        return workflow.compile()
    
    async def divide_step(self, state: ScriptState):
        result = await self.divider.divide(state["script_content"])
        return {"shots": result.shots}
    
    async def extract_step(self, state: ScriptState):
        result = await self.extractor.extract(
            state["script_content"],
            ["characters", "scenes"]
        )
        return {"entities": {
            "characters": result.characters,
            "scenes": result.scenes
        }}
    
    async def check_consistency_step(self, state: ScriptState):
        issues = await self.consistency.check(
            state["shots"],
            state["entities"]
        )
        return {"consistency_issues": issues}
```

### TypeScript/NestJS 版本

```typescript
// script-processing/chains/script-processing.chain.ts
import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, END } from '@langchain/langgraph';
import { ScriptDividerAgent, ScriptDivisionResult } from '../agents/script-divider.agent';
import { ElementExtractorAgent, ElementExtractionResult } from '../agents/element-extractor.agent';
import { ConsistencyCheckerAgent } from '../agents/consistency-checker.agent';

// 定义状态类型
interface ScriptState {
  scriptContent: string;
  chapterId: number;
  shots?: Array<{
    shotNumber: string;
    content: string;
  }>;
  entities?: {
    characters?: Array<{ name: string }>;
    scenes?: Array<{ name: string }>;
  };
  consistencyIssues?: string[];
}

@Injectable()
export class ScriptProcessingChain {
  private readonly logger = new Logger(ScriptProcessingChain.name);

  constructor(
    private readonly dividerAgent: ScriptDividerAgent,
    private readonly extractorAgent: ElementExtractorAgent,
    private readonly consistencyAgent: ConsistencyCheckerAgent,
  ) {}

  async process(
    scriptContent: string,
    chapterId: number,
  ): Promise<ScriptState> {
    const graph = this.buildGraph();
    
    const initialState: ScriptState = {
      scriptContent,
      chapterId,
    };

    this.logger.debug('开始剧本处理工作流');
    const result = await graph.invoke(initialState);
    this.logger.debug('剧本处理工作流完成');

    return result;
  }

  private buildGraph(): StateGraph<ScriptState> {
    const workflow = new StateGraph<ScriptState>({
      channels: {
        scriptContent: {
          value: (x: string, y: string) => y ?? x,
          default: () => '',
        },
        chapterId: {
          value: (x: number, y: number) => y ?? x,
          default: () => 0,
        },
        shots: {
          value: (x, y) => y ?? x,
          default: () => undefined,
        },
        entities: {
          value: (x, y) => y ?? x,
          default: () => undefined,
        },
        consistencyIssues: {
          value: (x, y) => y ?? x,
          default: () => undefined,
        },
      },
    });

    // 添加节点
    workflow.addNode('divide', this.divideStep.bind(this));
    workflow.addNode('extract', this.extractStep.bind(this));
    workflow.addNode('checkConsistency', this.checkConsistencyStep.bind(this));

    // 添加边
    workflow.setEntryPoint('divide');
    workflow.addEdge('divide', 'extract');
    workflow.addEdge('extract', 'checkConsistency');
    workflow.addEdge('checkConsistency', END);

    return workflow.compile();
  }

  private async divideStep(state: ScriptState): Promise<Partial<ScriptState>> {
    this.logger.debug('执行分割步骤');
    
    const result = await this.dividerAgent.divide(state.scriptContent);
    
    return {
      shots: result.shots.map(shot => ({
        shotNumber: shot.shotNumber,
        content: shot.content,
      })),
    };
  }

  private async extractStep(state: ScriptState): Promise<Partial<ScriptState>> {
    this.logger.debug('执行提取步骤');
    
    const result = await this.extractorAgent.extract(
      state.scriptContent,
      ['characters', 'scenes'],
    );

    return {
      entities: {
        characters: result.characters,
        scenes: result.scenes,
      },
    };
  }

  private async checkConsistencyStep(
    state: ScriptState,
  ): Promise<Partial<ScriptState>> {
    this.logger.debug('执行一致性检查步骤');
    
    const issues = await this.consistencyAgent.check(
      state.shots || [],
      state.entities || { characters: [], scenes: [] },
    );

    return {
      consistencyIssues: issues,
    };
  }
}
```

## 关键差异总结

| 特性 | Python LangChain | TypeScript LangChain |
|------|------------------|---------------------|
| 类型定义 | Pydantic | Zod |
| 装饰器 | 类方法 | @Injectable() |
| 异步 | async/await | async/await (相同) |
| 日志 | logging | NestJS Logger |
| 错误处理 | try/except | try/catch |
| LangGraph | 状态类型注解 | 泛型类型参数 |
