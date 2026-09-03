## 1. 清理 overlay.js

- [x] 1.1 删除 `/wiki` 命令已移除的提示代码块 (行 241-254)
- [x] 1.2 删除 wiki mode 相关的注释 (行 320, 470, 860)

## 2. 清理 overlay.html CSS

- [x] 2.1 删除 `.result-badge.wiki` 样式 (行 252)
- [x] 2.2 删除 `.wiki-mode-indicator` 样式 (行 415-427)
- [x] 2.3 删除 `.wiki-result-header` 样式 (行 428-437)
- [x] 2.4 删除 `.wiki-badge` 样式 (行 438-446)
- [x] 2.5 删除 `.wiki-desc` 样式 (行 447-451)
- [x] 2.6 删除 `.wiki-result` 和 `.wiki-result:hover` 样式 (行 452-457)

## 3. 清理 config.html

- [x] 3.1 删除 subtitle 中的 "wiki search" 文字 (行 182)
- [x] 3.2 删除整个 "Confluence Wiki" 配置区块 (行 203-210)
- [x] 3.3 删除 "How to use wiki search" 说明区块 (行 219-227)

## 4. 清理 config.js

- [x] 4.1 删除 Confluence token 测试逻辑 (行 64-79)
- [x] 4.2 删除 confluenceToken 相关的 storage 操作

## 5. 验证

- [x] 5.1 确认扩展仍能正常加载
- [x] 5.2 确认配置页面正常显示（仅 HAI Proxy）
- [x] 5.3 确认输入 `/wiki` 不会触发特殊行为
