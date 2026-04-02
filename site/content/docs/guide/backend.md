---
title: "后端说明"
weight: 3
description: "理解后端路由主轴、分层结构与服务定位。"
---

后端位于 `backend/`，使用 FastAPI、SQLAlchemy、LangChain / LangGraph 构建。

核心分层：

- `app/main.py`：应用入口
- `app/api/v1/`：路由层
- `app/services/`：业务服务层
- `app/models/`：ORM 模型
- `app/schemas/`：请求响应模型
- `app/chains/`：Agent、Prompt 与工作流

## 路由主轴

当前主要接口聚焦在：

- `studio`：项目、章节、分镜、文件、提示词、时间线等主业务
- `llm`：模型与供应商能力
- `film`：生成相关接口
- `script-processing`：脚本处理与提取能力

## 服务层定位

`app/services/` 负责承接业务逻辑，而不是把复杂逻辑全部塞进路由中。  
像分镜草稿拼装、图片任务构建、模型解析等能力，都已经下沉到了 service 层。
