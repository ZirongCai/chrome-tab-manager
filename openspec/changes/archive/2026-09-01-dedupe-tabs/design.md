## Context

Tab Manager 是一个 Chrome 扩展，提供 Search Mode 和 Browse Mode 两种标签页管理方式。Browse Mode 展示所有打开的标签页，按域名分组显示，并提供关闭单个标签页或整个域名标签页的功能。

当前状态：
- `TabManager.closeDuplicateTabs(urls, keepOne)` 已存在于 `core.js`，可以关闭重复标签页
- Browse Mode 有统计区域显示 tabs/domains/groups 数量
- 没有检测重复标签页的可视化功能

## Goals / Non-Goals

**Goals:**
- 在 Browse Mode 提供一键消除重复标签页的功能
- 显示当前重复标签页的数量，帮助用户决策
- 清理后给用户明确的反馈

**Non-Goals:**
- 不在 Search Mode 添加此功能（Browse Mode 是标签管理的主要场所）
- 不提供选择保留哪个重复标签页的功能（自动保留活跃或第一个）
- 不支持"预览"将被关闭的标签页

## Decisions

### 1. 按钮位置：Browse Mode 统计栏

**选择**: 在统计栏（tabs/domains/groups）旁边添加 Deduplicate 按钮

**理由**: 
- 统计栏已经是用户了解标签页状态的地方
- 与"关闭所有域名标签页"的操作模式一致
- 不需要修改 HTML 结构，只需扩展 `renderBrowseMode()` 函数

**备选方案**:
- 添加为独立工具栏按钮 — 增加 UI 复杂度
- 放在域名组的右键菜单 — 不够直观

### 2. 重复检测逻辑：精确 URL 匹配

**选择**: 使用完整 URL 匹配来判断重复

**理由**:
- 简单明确，用户容易理解
- 已有的 `closeDuplicateTabs` 就是这样实现的
- 避免 URL 参数差异导致误判（如 `?tab=1` vs `?tab=2`）

**备选方案**:
- 忽略 URL 参数 — 可能误关闭不同内容的页面
- 忽略 hash — 对于 SPA 应用可能有问题

### 3. 保留策略：优先保留活跃标签页

**选择**: 保留活跃标签页，如果没有活跃的则保留第一个

**理由**:
- 用户正在查看的标签页最重要
- `closeDuplicateTabs` 已实现此逻辑
- 符合用户直觉

### 4. 反馈方式：Toast 通知

**选择**: 使用现有的 toast 组件显示关闭结果

**理由**:
- 项目已有 `DOMHelpers.showToast()` 
- 轻量、不打断用户流程
- 与其他操作的反馈方式一致

## Risks / Trade-offs

**[Risk] 用户误操作关闭重要标签页** → 无法撤销，但保留活跃标签页策略降低风险。未来可考虑添加确认对话框（Non-Goal 当前版本）。

**[Risk] 重复数量计算可能有性能开销** → 标签页数量通常不超过几百个，O(n²) 扫描可接受。

**[Trade-off] 不提供预览** → 简化实现，但用户无法提前知道哪些标签会被关闭。权衡后认为"显示重复数量"已足够。
