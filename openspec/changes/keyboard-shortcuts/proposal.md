## Why

用户希望能通过键盘快捷键直接 pin 当前页面，而不需要用鼠标点击按钮。同时，用户不清楚 Tab Manager 有哪些可用的快捷键，需要在界面上显示快捷键提示。

## What Changes

- 添加 `Cmd/Ctrl+P` 快捷键用于在 Browse Mode 中 pin/unpin 当前活跃标签页
- 在 overlay 页面底部添加快捷键提示栏，显示所有可用的快捷键
- 快捷键提示在 Search Mode 和 Browse Mode 中显示不同内容

## Capabilities

### New Capabilities

- `keyboard-shortcuts`: 键盘快捷键支持和快捷键提示显示

### Modified Capabilities

（无需修改现有能力的规格）

## Impact

- **代码**: `overlay.js` - 添加键盘事件处理
- **代码**: `overlay.html` - 添加快捷键提示栏 UI 和样式
- **用户体验**: 用户可以更快速地操作，并且知道有哪些快捷键可用
