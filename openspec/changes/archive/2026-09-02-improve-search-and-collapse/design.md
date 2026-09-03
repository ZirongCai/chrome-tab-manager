## Context

当前 Tab Out 的搜索功能使用自定义评分算法 (`_scoreItem`)，主要基于字符串匹配：
- 单词搜索：exact (100) > starts-with (80) > contains (50) > fuzzy (30)
- 多词搜索：所有词必须匹配，title 40分/词，URL 20分/词
- 类型加权：tabs (2.0x) > bookmarks (1.3x) > history (0.8x)
- 简单的 fuzzy 匹配：仅检查字符顺序出现

当前折叠逻辑：
- 普通搜索结果组：最多显示 3 个 (`MAX_INITIAL_ITEMS = 3`)，多余的折叠
- Pinned 组：**没有折叠功能**，全部显示

## Goals / Non-Goals

**Goals:**
- 引入 Fuse.js 提供更智能的模糊搜索和相关性排序
- 统一所有搜索结果组的折叠行为：最多显示 2 个最匹配的结果
- 保持或提升搜索性能（Fuse.js 已优化）
- 保持现有的 pin 高优先级逻辑

**Non-Goals:**
- 不改变浏览模式 (Browse Mode) 的折叠逻辑
- 不修改 pin 的存储结构或管理功能
- 不引入服务器端搜索

## Decisions

### Decision 1: 使用 Fuse.js 作为搜索引擎

**选择**: Fuse.js (https://fusejs.io/)

**理由**:
- 轻量级 (~6KB gzipped)，适合浏览器扩展
- 成熟的模糊搜索算法，支持 typo tolerance
- 可配置的搜索选项（threshold、distance、keys 权重）
- 无需外部依赖，纯 JavaScript

**备选方案**:
1. **Lunr.js**: 更重量级（~8KB），面向全文搜索，对短查询不够友好
2. **FlexSearch**: 性能更好但 API 复杂，对模糊匹配支持有限
3. **自定义改进**: 维护成本高，难以达到成熟库的质量

**集成方式**:
- 下载 fuse.min.js 到 `extension/lib/` 目录
- 在 manifest.json 中添加为 content script
- 保留现有的类型加权和 recency 加权逻辑，与 Fuse.js 分数叠加

### Decision 2: Fuse.js 配置

```javascript
const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'url', weight: 0.3 }
  ],
  threshold: 0.4,        // 允许一定程度的模糊匹配
  distance: 100,         // 匹配字符的最大距离
  includeScore: true,    // 返回分数用于排序
  ignoreLocation: true,  // 不限制匹配位置
  minMatchCharLength: 2, // 最小匹配长度
  useExtendedSearch: true // 支持精确匹配语法
};
```

### Decision 3: 统一折叠逻辑

**选择**: `MAX_INITIAL_ITEMS = 2`，适用于所有组（包括 Pinned 组）

**理由**:
- 用户明确要求最多显示 2 个
- 更紧凑的界面，减少滚动
- Pinned 组通常不会很多，2 个足够快速访问最常用的

**实现**:
- 修改 `overlay.js` 中 `MAX_INITIAL_ITEMS` 常量从 3 改为 2
- 确保 `renderSearchResults()` 对 pinned 组也应用相同的折叠逻辑

### Decision 4: 保持 Pin 的高优先级

Fuse.js 分数范围是 0-1（越低越好），需要转换为与现有系统兼容的分数：
- Pin 基础分数保持在 9000+ 范围
- Fuse.js 分数用于组内排序
- Pin 组始终显示在最顶部（现有逻辑保持不变）

## Risks / Trade-offs

**[Risk] Fuse.js 增加扩展体积**
→ Mitigation: fuse.min.js 仅 ~24KB 未压缩，~6KB gzipped，影响可忽略

**[Risk] 搜索结果排序变化可能影响用户习惯**
→ Mitigation: 保留类型加权（tabs > bookmarks > history）和 Pin 高优先级

**[Risk] 折叠为 2 个可能隐藏重要结果**
→ Mitigation: "Show more" 按钮清晰可见，键盘可导航

**[Trade-off] 精确匹配 vs 模糊匹配**
→ Fuse.js 的 threshold 设为 0.4 平衡精确性和容错性；用户可通过引号进行精确搜索
