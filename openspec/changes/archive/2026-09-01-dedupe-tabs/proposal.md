## Why

用户在浏览器中经常会打开相同URL的多个标签页，导致标签栏混乱和内存浪费。Tab Manager 的 Browse Mode 已经提供了标签页的可视化管理，但目前没有快速识别和清理重复标签页的功能。用户需要一键清除重复标签页的能力。

## What Changes

- 在 Browse Mode 的统计区域添加"Deduplicate"按钮
- 实现一键检测并关闭重复标签页的功能（保留每个URL的第一个或活跃标签页）
- 显示重复标签页的数量，让用户知道有多少可以清理
- 清理完成后显示 toast 提示，告知用户关闭了多少标签页

## Capabilities

### New Capabilities

- `dedupe-tabs`: 在 Browse Mode 中一键检测并关闭重复打开的标签页功能

### Modified Capabilities

（无需修改现有能力的规格）

## Impact

- **代码**: `overlay.js` - 添加 dedupe 按钮渲染和点击处理逻辑
- **代码**: `overlay.html` - 可能需要添加样式支持
- **代码**: `core.js` - 已有 `TabManager.closeDuplicateTabs()` 可复用
- **用户体验**: 用户可以在 Browse Mode 中快速清理重复标签页
