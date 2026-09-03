## Why

代码库随着功能迭代积累了大量未使用的代码和重复逻辑，同时许多配置值硬编码在多个文件中，难以维护和自定义。需要进行全面清理和配置化重构，提升代码质量和可维护性。

## What Changes

### Dead Code Removal
- **core.js**: 移除 8 个未使用的 `TextHelpers` 函数、6 个未使用的 `ICONS` 条目、未使用的 `BookmarkManager.searchBookmarks`
- **overlay.js**: 移除空的 `COMMANDS` 框架及相关死代码（~200 行）、移除未使用的本地 `highlightMatch` 函数、移除被 shadow 的 `isUserPinned` 导入
- **background.js**: 移除重复的 `generateKeywords` 函数

### Duplicate Code Consolidation
- 合并重复的 `getGroupColor` 函数（core.js 和 overlay.js）
- 合并重复的 `escapeHtml` 函数（overlay.js 和 search.js）
- 合并重复的 TLD 清理逻辑
- 合并重复的浏览器内部 URL 过滤逻辑

### Configuration Extraction
- 创建 `constants.js` 统一管理：
  - Badge 阈值和颜色
  - Toast 显示时长
  - 搜索评分权重
  - 防抖延迟
  - TLD 列表
  - 浏览器内部 URL 前缀
  - Stop words 列表

## Capabilities

### New Capabilities
- `configurable-constants`: 可配置常量系统，将硬编码值提取到独立配置文件

### Modified Capabilities
<!-- No existing spec requirements are changing -->

## Impact

- **extension/constants.js**: 新建，统一配置常量
- **extension/core.js**: 移除未使用代码，导出共用函数
- **extension/overlay.js**: 移除死代码，引用共用函数
- **extension/search.js**: 引用配置常量
- **extension/background.js**: 移除重复代码，引用共用函数
- **代码体积**: 预计减少 ~400 行无用代码
- **可维护性**: 配置集中管理，修改更便捷
