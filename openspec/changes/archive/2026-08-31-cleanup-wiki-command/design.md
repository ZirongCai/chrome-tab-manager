## Context

Tab-out 浏览器扩展之前有一个 `/wiki` 命令用于搜索 Confluence wiki。该命令已被移除，但相关代码没有清理干净，残留在多个文件中：

- `overlay.js`: 显示 "wiki command has been removed" 的处理代码
- `config.html`: Confluence Token 配置 UI 和使用说明
- `config.js`: Confluence token 测试逻辑
- `overlay.html`: wiki 相关的 CSS 样式

## Goals / Non-Goals

**Goals:**
- 彻底移除所有 wiki command 相关的残留代码
- 保持代码整洁，减少维护负担
- 不影响其他现有功能

**Non-Goals:**
- 不移除与 wiki command 无关的 wiki URL 处理逻辑（search.js 中的 URL 解析是通用功能）
- 不移除 wikipedia.org 域名映射（domain-names.js 是通用配置）
- 不重构或改进现有功能

## Decisions

### 1. 完全删除 vs 保留提示

**决定**: 完全删除 wiki command 入口，不保留任何提示

**理由**: 
- 保留 "已移除" 提示只会让用户困惑
- 用户无需知道曾经存在过这个功能
- 减少代码维护负担

### 2. 配置页面处理

**决定**: 删除整个 Confluence Wiki 配置区块和说明

**理由**:
- Token 配置已无用，保留会误导用户
- 配置页面应只显示实际可用的功能

### 3. 保留的内容

**决定**: 保留 search.js 中的 wiki URL 处理和 domain-names.js 中的 wikipedia 映射

**理由**:
- search.js 中的 `wiki:${spaceId}` 分组逻辑用于智能 URL 去重，独立于 wiki command
- wikipedia.org 是通用域名映射，与 wiki command 无关

## Risks / Trade-offs

**[风险] 删除配置代码可能影响其他功能**
→ 缓解: Confluence token 只在 wiki command 中使用，其他功能不依赖

**[风险] 用户可能仍尝试使用 /wiki**
→ 缓解: 删除后用户输入 /wi 时不会匹配任何命令，自然引导至正确行为
