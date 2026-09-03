## Context

当前代码库存在以下问题：
1. **Dead Code**: core.js 中有 8 个未使用的 TextHelpers 函数，overlay.js 有整个空的命令模式框架
2. **重复代码**: getGroupColor、escapeHtml、TLD 清理、URL 过滤在多处重复定义
3. **硬编码值**: 评分权重、超时时间、阈值等散布在 search.js、overlay.js、background.js 中

现有的 `domain-names.js` 模式是一个好的参考——独立配置文件，可被其他模块导入。

## Goals / Non-Goals

**Goals:**
- 移除所有确认未使用的死代码
- 将重复代码合并到单一位置（core.js）
- 创建 `constants.js` 统一管理可配置常量
- 保持向后兼容，不改变功能行为

**Non-Goals:**
- 不重构大型函数（如 setupSearch、renderResults）——范围控制
- 不添加 UI 配置界面——仅文件级配置
- 不移除可能未来会用到的代码（保守策略）

## Decisions

### Decision 1: 创建 constants.js 作为配置中心

**选择**: 新建 `extension/constants.js`，导出所有可配置常量

**结构**:
```javascript
// extension/constants.js
export const SEARCH_CONFIG = {
  maxInitialItems: 2,
  debounceDelay: 150,
  maxHistoryDays: 90,
  maxHistoryResults: 50,
  fuseThreshold: 0.4,
  fuseDistance: 100,
};

export const SCORE_WEIGHTS = {
  tab: 2.0,
  bookmark: 1.3,
  history: 0.8,
  pinBase: 9000,
  pinExact: 10000,
  titleExact: 100,
  titlePrefix: 80,
  titleContains: 50,
  titleFuzzy: 30,
  urlDomain: 60,
  urlContains: 40,
  recencyToday: 1.5,
  recencyWeek: 1.3,
  recencyMonth: 1.1,
};

export const BADGE_CONFIG = {
  thresholds: { low: 10, medium: 20 },
  colors: { low: '#3d7a4a', medium: '#b8892e', high: '#b35a5a' },
};

export const TIMING = {
  toastDuration: 2500,
  toastFadeOut: 200,
  tabGroupDelay: 100,
};

export const BROWSER_INTERNAL_PREFIXES = [
  'chrome://', 'chrome-extension://', 'about:', 'edge://', 'brave://'
];

export const TLD_LIST = ['com', 'org', 'net', 'io', 'co', 'ai', 'dev', 'app', 'so', 'me', 'xyz', 'info', 'us', 'uk', 'co.uk', 'co.jp'];

export const STOP_WORDS = {
  url: ['www', 'com', 'org', 'net', 'index', 'html', 'page', 'view', 'api', 'v1', 'v2'],
  title: ['the', 'and', 'for', 'with', 'from', 'this', 'that'],
};
```

**理由**: 与 domain-names.js 模式一致，易于理解和修改

### Decision 2: 死代码处理策略

**移除** (确认未使用):
- TextHelpers: parseGardenerUrl, getTabGroupKey, getSmartGroupName, stripTitleNoise, cleanTitle, smartTitle, timeAgo, getGreeting, getDateDisplay
- ICONS: close, archive, focus, folder, search, expand, chevron, history
- BookmarkManager.searchBookmarks
- overlay.js: COMMANDS 框架、本地 highlightMatch、shadowed isUserPinned 导入
- background.js: generateKeywords (与 search.js 重复)

**保留** (可能有用):
- ICONS.tabs, ICONS.bookmark (正在使用)

### Decision 3: 重复代码合并策略

| 函数 | 保留位置 | 移除位置 |
|------|----------|----------|
| getGroupColor | core.js | overlay.js |
| escapeHtml | core.js | overlay.js, search.js |
| isInternalUrl | core.js (新建) | background.js 内联逻辑 |
| cleanHostname/friendlyDomain | core.js | overlay.js |

## Risks / Trade-offs

**[Risk] 移除代码可能影响未知功能**
→ Mitigation: 只移除经过扫描确认未调用的代码，保守处理

**[Risk] 配置文件增加导入复杂度**
→ Mitigation: 使用清晰的命名和分组，减少认知负担

**[Trade-off] 集中配置 vs 就近定义**
→ 选择集中配置，因为这些值需要跨模块一致，且便于未来添加 UI 配置
