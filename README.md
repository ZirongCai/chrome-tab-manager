# Tab Manager

**Arc-inspired Chrome extension for managing tabs and bookmarks.**

A lightweight side panel that keeps your tabs organized and searchable. Built with vanilla JavaScript, no frameworks, no bloat.

---

## ✨ Features

- **📂 Side Panel** — Always-accessible panel showing bookmarks and tabs
- **🔍 Quick Search** — Search tabs, bookmarks, and history in one overlay
- **🎨 Tab Groups** — Create, color-code, and auto-group new tabs
- **📌 Pin Pages** — Pin frequently visited pages for quick access
- **⌨️ Keyboard-first** — Three shortcuts to rule them all

---

## 🚀 Installation

1. Clone this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select `extension/` folder
5. Done! Click the extension icon or use keyboard shortcuts

**Requirements**: Chrome 114+

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘⇧K` / `Ctrl+Shift+K` | Open quick search overlay |
| `⌘⇧L` / `Ctrl+Shift+L` | Create new tab group |
| `⌘⇧P` / `Ctrl+Shift+P` | Pin current page |

### In Quick Search

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate results |
| `Enter` | Open selected result |
| `Tab` | Switch to Browse mode |
| `Escape` | Close overlay |

### In Browse Mode

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate tabs/groups |
| `Enter` | Switch to selected tab |
| `⌘⌫` / `Ctrl+Backspace` | Close selected tab |
| `Tab` / `Escape` | Return to Search mode |

---

## 📖 Usage

### Quick Search (`⌘⇧K`)

Type to search across:
- **Open tabs** — Switch to existing tab
- **Bookmarks** — Open bookmarked page
- **History** — Revisit recent pages

Results are grouped by domain and ranked by relevance.

### Browse Mode

Press `Tab` in quick search to see all open tabs organized by:
- **Tab Groups** — Chrome's native tab groups
- **Domains** — Ungrouped tabs sorted by website

Features:
- Close individual tabs or entire domain groups
- Rename domain groups for better organization
- Deduplicate tabs with one click

### Pin Pages (`⌘⇧P`)

Pin frequently visited URLs for instant access. Pinned pages appear at the top of search results with custom names.

---

## 📄 License

MIT
