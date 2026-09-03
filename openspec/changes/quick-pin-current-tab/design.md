## Context

Tab Manager 扩展在 Browse Mode 中展示所有标签页，并用绿色圆点标记当前活跃标签页。现有的 pin 功能需要在 Search Mode 中搜索页面后才能操作。

当前状态：
- `addUserPin(url, title)` 和 `removeUserPin(url)` 已存在于 `search.js`
- `renderBrowseTab(tab)` 函数渲染每个标签页项，活跃标签页有 `.active-tab` class
- `browseData.activeTabId` 追踪当前活跃标签页的 ID
- overlay.js 已经 import 了 `addUserPin`, `removeUserPin`, `isUserPinned` 函数

## Goals / Non-Goals

**Goals:**
- 在 Browse Mode 中为当前活跃标签页提供快速 pin/unpin 能力
- 保持与现有 UI 风格一致
- 操作后给用户明确反馈

**Non-Goals:**
- 不为所有标签页添加 pin 按钮（只针对活跃标签页，保持界面简洁）
- 不修改 Search Mode 的 pin 功能
- 不实现批量 pin 功能

## Decisions

### 1. Pin 按钮位置：活跃标签页行内

**选择**: 只在活跃标签页（`.active-tab`）行内显示 pin 按钮

**理由**:
- 保持界面简洁，不为每个标签页都添加按钮
- 活跃标签页是用户当前关注的页面，最有可能需要 pin
- 与现有"关闭按钮"的位置和样式保持一致

**备选方案**:
- 为所有标签页添加 pin 按钮 — 界面太拥挤
- 在统计栏添加"Pin Current"按钮 — 不够直观

### 2. 按钮状态：根据 pin 状态切换图标/样式

**选择**: pin 按钮根据当前 URL 的 pin 状态显示不同样式（类似 Search Mode）

**理由**:
- 用户可以清楚看到当前页面是否已被 pin
- 一个按钮实现 pin/unpin 双向操作
- 与 Search Mode 的 pin 按钮行为一致

### 3. 反馈方式：Toast 通知

**选择**: 使用现有的 `showToast()` 函数显示操作结果

**理由**:
- 与 deduplicate 功能的反馈方式一致
- 轻量、不打断用户流程

## Risks / Trade-offs

**[Trade-off] 只为活跃标签页添加按钮** → 用户如果想 pin 其他标签页仍需使用 Search Mode，但这保持了界面简洁，且最常见的场景是 pin 当前正在浏览的页面。
