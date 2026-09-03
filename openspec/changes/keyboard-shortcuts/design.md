## Context

Tab Manager 已有一些键盘快捷键：
- Search Mode: `↑↓` 导航、`Enter` 选中、`Esc` 退出命令模式、`Tab` 切换到 Browse Mode
- Browse Mode: `↑↓` 导航、`Enter` 激活选中项、`Cmd+Backspace` 关闭选中标签页、`Tab` 切换到 Search Mode、`Esc` 返回 Search Mode

刚实现的 `togglePinCurrentTab()` 函数可以被键盘快捷键调用。

## Goals / Non-Goals

**Goals:**
- 提供 `Cmd/Ctrl+P` 快捷键在 Browse Mode 中 pin/unpin 当前活跃标签页
- 在 overlay 底部显示快捷键提示，根据当前 mode 显示对应快捷键
- 提示简洁、不遮挡主要内容

**Non-Goals:**
- 不实现自定义快捷键配置
- 不为每个操作都添加快捷键（保持简洁）
- 不在 Search Mode 添加 pin 快捷键（Search Mode 主要用于搜索，pin 在 Browse Mode 更合理）

## Decisions

### 1. Pin 快捷键：`Cmd/Ctrl+P`

**选择**: 使用 `Cmd+P` (Mac) / `Ctrl+P` (Windows/Linux)

**理由**:
- P = Pin，助记性强
- 常见快捷键组合，用户容易记住
- 不与 Chrome 内置快捷键冲突（overlay 是独立页面）

**备选方案**:
- `Cmd+D` — 与浏览器书签功能冲突
- `Cmd+Shift+P` — 太复杂

### 2. 快捷键提示位置：overlay 底部固定栏

**选择**: 在 search-container 底部添加固定的快捷键提示栏

**理由**:
- 不遮挡搜索结果或标签页列表
- 始终可见，方便用户参考
- 与现有 UI 风格一致

### 3. 提示内容：根据 mode 动态显示

**选择**: Search Mode 和 Browse Mode 显示不同的快捷键

**理由**:
- 只显示当前 mode 可用的快捷键
- 避免信息过载
- 用户更容易找到需要的快捷键

**快捷键列表**:
- Search Mode: `↑↓` 导航、`⏎` 选中、`Tab` 切换到 Browse
- Browse Mode: `↑↓` 导航、`⏎` 选中、`⌘P` Pin、`⌘⌫` 关闭、`Tab` 切换到 Search

## Risks / Trade-offs

**[Trade-off] 底部提示栏占用空间** → 提示栏高度较小（约30px），对主要内容影响很小。

**[Risk] `Cmd+P` 可能与系统打印冲突** → 由于 overlay 是扩展页面，不是普通网页，快捷键会被正确捕获。
