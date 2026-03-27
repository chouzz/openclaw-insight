# OpenClaw 日志分析器

一个用于分析和可视化 OpenClaw 日志的 Web 应用。

## 功能

- 📊 **会话列表**：查看所有 OpenClaw 会话及其统计信息
- 🔍 **事件时间线**：可视化查看每个会话的事件流程
- 🛠️ **工具调用分析**：统计和分析工具调用情况
- 💰 **Token 使用统计**：追踪 token 消耗和成本
- 🔎 **搜索和筛选**：按会话 ID、工具类型等条件过滤

## 技术栈

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- pnpm

## 快速开始

### 安装依赖

```bash
cd /Users/zhouhua/Desktop/openclaw-logs
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 日志位置

应用默认读取日志目录：
```
/Users/zhouhua/.openclaw/agents/main/sessions
```

如需修改日志目录，编辑 `src/lib/logParser.ts` 中的 `LOGS_DIR` 常量。

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── logs/
│   │       ├── route.ts              # 获取所有会话列表
│   │       └── [sessionId]/route.ts   # 获取单个会话详情
│   ├── session/
│   │   └── [sessionId]/
│   │       └── page.tsx              # 会话详情页面
│   ├── globals.css                   # 全局样式
│   ├── layout.tsx                    # 根布局
│   └── page.tsx                      # 主页
├── lib/
│   └── logParser.ts                  # 日志解析工具
└── types/
    └── log.ts                        # 类型定义
```

## 数据可视化

### 主页

- 显示所有会话的概览
- 总体统计：会话数、事件数、Token 数、花费、工具调用次数
- 搜索和筛选功能
- 会话列表，显示每个会话的关键信息

### 会话详情页

- 会话信息和统计数据
- 工具调用统计（成功/失败次数）
- 事件时间线（支持筛选显示不同类型的事件）
  - 消息（用户/助手/系统）
  - 工具调用
  - 工具结果
  - 思考级别变化
  - 自定义事件

## 开发提示

- 日志解析在服务端完成（Node.js Runtime）
- 前端使用 TypeScript 和 React 18
- 响应式设计，支持桌面和移动设备
