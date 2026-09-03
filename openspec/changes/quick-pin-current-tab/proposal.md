## Why

目前用户要 pin 一个页面必须在 Search Mode 中搜索该页面，找到后再点击 pin 按钮。这个流程太繁琐，特别是当用户正在浏览某个页面想要快速 pin 它时。需要一个更直接的方式来 pin 当前正在查看的标签页。

## What Changes

- 在 Browse Mode 的标签页列表中，为"当前活跃标签页"添加专属的 Pin 按钮
- 用户可以直接在 Browse Mode 一键 pin/unpin 当前正在浏览的页面
- Pin 状态变化后显示 toast 提示

## Capabilities

### New Capabilities

- `quick-pin`: 在 Browse Mode 中快速 pin/unpin 当前活跃标签页的功能

### Modified Capabilities

（无需修改现有能力的规格）

## Impact

- **代码**: `overlay.js` - 修改 `renderBrowseTab()` 为活跃标签页添加 pin 按钮
- **代码**: `overlay.html` - 添加 pin 按钮的样式
- **依赖**: 复用现有的 `addUserPin()` 和 `removeUserPin()` 函数（来自 search.js）
- **用户体验**: 用户可以在 Browse Mode 中直接 pin 当前页面，无需搜索
