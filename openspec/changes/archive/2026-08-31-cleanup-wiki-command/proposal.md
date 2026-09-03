## Why

Wiki command 已被删除，但代码中仍残留大量相关内容：
- overlay.js 中有 "wiki command has been removed" 的提示代码
- config.html/js 中仍有 Confluence Token 配置界面和测试逻辑
- overlay.html 中有 wiki 相关的 CSS 样式
- 多处注释仍提及 wiki mode

这些残留代码增加了维护负担且容易造成困惑，需要彻底清理。

## What Changes

- 删除 overlay.js 中 `/wiki` 命令的 "已移除" 提示代码
- 删除 config.html 中 Confluence Wiki 配置区块和使用说明
- 删除 config.js 中 Confluence token 相关的保存和测试逻辑
- 删除 overlay.html 中所有 wiki 相关的 CSS 样式
- 清理 overlay.js 中 wiki 相关的注释

**不删除的内容**（合理保留）：
- domain-names.js 中的 `wikipedia.org` 映射（这是通用域名配置，非 wiki command）
- search.js 中的 wiki URL 解析逻辑（用于智能 URL 分组，非 wiki command）

## Capabilities

### New Capabilities
无 - 这是纯清理任务

### Modified Capabilities
无 - 不改变现有功能行为

## Impact

- **代码文件**：overlay.js, overlay.html, config.html, config.js
- **用户影响**：配置页面将不再显示 Confluence Token 设置（该功能本已无用）
- **依赖**：无外部依赖变更
