## Why

Sidebar 功能虽然有用，但存在明显的用户体验问题：一直开着占用页面空间，按需打开又很麻烦（需要打开再关闭），而且 sidebar 显示空间有限不够清晰。用户需要一种更便捷的方式来 overview 所有打开的标签页，同时保持搜索作为主要功能。

## What Changes

- **新增 Tab Overview 面板**：在现有 overlay 中集成一个可切换的 tab overview 功能，显示所有打开的标签页、分组、书签等信息
- **双模式切换**：overlay 支持「搜索模式」和「浏览模式」两种视图，默认为搜索模式
- **快捷键触发**：保持 `Cmd+Shift+K` 打开 overlay，通过 Tab 键或点击切换到浏览模式
- **精简信息展示**：浏览模式采用紧凑布局，按域名分组显示标签页，支持快速操作（关闭、切换、分组）
- **保持轻量**：不改变 overlay 的弹窗特性，用完即走，不占用页面空间

## Capabilities

### New Capabilities

- `overlay-browse-mode`: 在 overlay 中添加浏览模式，展示所有打开的标签页概览，支持按域名分组、Tab Groups 展示、快速操作（关闭、切换）

### Modified Capabilities

（无需修改现有 spec）

## Impact

- **overlay.js / overlay.html**：主要修改，添加浏览模式的 UI 和逻辑
- **core.js**：可能需要复用 sidebar 中的 tab 渲染逻辑
- **background.js**：无需修改，复用现有的快捷键监听
- **sidepanel.js**：作为参考，部分逻辑可能需要抽取复用
