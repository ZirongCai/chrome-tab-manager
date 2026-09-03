## Why

当前搜索算法使用简单的字符串匹配（exact、starts-with、contains、fuzzy），对多词查询的支持有限，且缺乏成熟的模糊匹配能力。同时，搜索结果中 pinned 项目没有折叠功能，当 pin 数量较多时会占用大量空间。需要引入更成熟的搜索算法并统一折叠逻辑，提升用户体验。

## What Changes

- **搜索算法升级**: 引入 Fuse.js 模糊搜索库，提供更智能的搜索结果排序和模糊匹配能力
- **统一折叠功能**: 所有搜索结果分组（包括 Pinned 组）统一显示最多 2 个最匹配的结果，其余折叠
- **折叠交互优化**: 从当前的 3 个改为 2 个，并确保 pinned 组也支持展开/收起

## Capabilities

### New Capabilities
- `fuzzy-search`: 基于 Fuse.js 的模糊搜索能力，支持更智能的匹配和排序
- `unified-collapse`: 统一的搜索结果折叠逻辑，所有分组最多显示 2 个结果

### Modified Capabilities
<!-- No existing spec requirements are changing -->

## Impact

- **extension/search.js**: 替换 `_scoreItem()` 评分逻辑，集成 Fuse.js
- **extension/overlay.js**: 修改 `renderSearchResults()` 中的折叠逻辑，统一 `MAX_INITIAL_ITEMS` 为 2
- **extension/overlay.html**: 可能需要调整 pinned 组的 HTML 结构以支持折叠
- **manifest.json**: 添加 Fuse.js 依赖（或内联引入）
- **用户体验**: 搜索结果更精准，界面更紧凑
