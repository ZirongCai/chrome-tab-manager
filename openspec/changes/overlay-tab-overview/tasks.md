## 1. 基础架构

- [x] 1.1 在 `overlay.html` 中添加模式切换 UI（顶部 Tab 栏：Search / Browse）
- [x] 1.2 在 `overlay.js` 中添加模式状态管理（`currentMode: 'search' | 'browse'`）
- [x] 1.3 实现模式切换函数 `switchMode(mode)` 及对应的 DOM 显示/隐藏逻辑

## 2. 键盘导航扩展

- [x] 2.1 在搜索框为空时，Tab 键切换到 Browse Mode
- [x] 2.2 在 Browse Mode 下，Escape 键返回 Search Mode
- [x] 2.3 在 Browse Mode 下，实现上下箭头键在分组/tab 间导航

## 3. Tab 数据加载

- [x] 3.1 从 `sidepanel.js` 抽取 tab 分组逻辑到 `core.js`（按域名分组函数）
- [x] 3.2 在 `overlay.js` 中添加 `loadBrowseData()` 函数，按需加载 tabs 和 groups
- [x] 3.3 实现 Tab Groups 数据获取和格式化

## 4. Browse Mode UI - 布局

- [x] 4.1 在 `overlay.html` 中添加 Browse Mode 容器结构（统计栏 + 分组列表）
- [x] 4.2 添加 Browse Mode 的 CSS 样式（紧凑布局、分组卡片）
- [x] 4.3 实现统计栏显示（总 tab 数、域名数、Tab Groups 数）

## 5. Browse Mode UI - 域名分组

- [x] 5.1 实现域名分组的渲染函数 `renderDomainGroups(tabs)`
- [x] 5.2 实现分组折叠/展开交互
- [x] 5.3 添加域名分组的 favicon 和 tab 计数显示
- [x] 5.4 高亮当前活动的 tab

## 6. Browse Mode UI - Tab Groups

- [x] 6.1 实现 Chrome Tab Groups 的渲染函数 `renderTabGroups(groups)`
- [x] 6.2 添加 Tab Group 颜色指示器和名称显示
- [x] 6.3 实现 Tab Group 的折叠/展开交互

## 7. 快速操作

- [x] 7.1 实现点击 tab 项切换到该标签页并关闭 overlay
- [x] 7.2 实现 tab 项的关闭按钮（hover 显示 X）
- [x] 7.3 实现域名分组的「关闭全部」按钮
- [x] 7.4 实现键盘快捷键关闭 tab（`Cmd+Backspace`）

## 8. 状态保持与优化

- [x] 8.1 在模式切换时保持 Browse Mode 的展开状态和滚动位置
- [x] 8.2 添加 tab 关闭后的列表自动更新
- [ ] 8.3 性能优化：对大量 tab 的渲染使用虚拟滚动或分页（如超过 100 个 tab）

## 9. 测试与完善

- [x] 9.1 测试模式切换的流畅性
- [x] 9.2 测试键盘导航在各种状态下的正确性
- [x] 9.3 测试边界情况（无 tab、无 Tab Groups、大量 tab）
- [x] 9.4 调整 UI 细节（间距、颜色、动画）
