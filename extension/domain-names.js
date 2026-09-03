/**
 * domain-names.js — Domain Name Configuration
 *
 * This file contains the default domain-to-friendly-name mappings used
 * by Tab Manager's Browse Mode to display readable group names.
 *
 * HOW TO CUSTOMIZE:
 * ================
 * 1. Add your custom domain mappings to FRIENDLY_DOMAINS below
 * 2. Reload the extension (chrome://extensions → click refresh icon)
 * 3. Your custom names will appear in Browse Mode
 *
 * FORMAT:
 *   'domain.com': 'Display Name',
 *
 * EXAMPLES:
 *   'internal.mycompany.com': 'Company Portal',
 *   'jira.mycompany.com': 'Bug Tracker',
 *   'wiki.mycompany.com': 'Documentation',
 *
 * NOTE: You can also rename domains directly in Browse Mode by clicking
 * the edit icon on any domain group header. Those edits are stored in
 * Chrome storage and take priority over this file.
 */

// Map of known hostnames → friendly display names
export const FRIENDLY_DOMAINS = {
  // GitHub
  'github.com': 'GitHub',
  'www.github.com': 'GitHub',
  'gist.github.com': 'GitHub Gist',

  // Video & Entertainment
  'youtube.com': 'YouTube',
  'www.youtube.com': 'YouTube',
  'music.youtube.com': 'YouTube Music',
  'netflix.com': 'Netflix',
  'www.netflix.com': 'Netflix',
  'spotify.com': 'Spotify',
  'open.spotify.com': 'Spotify',

  // Social Media
  'x.com': 'X',
  'www.x.com': 'X',
  'twitter.com': 'X',
  'www.twitter.com': 'X',
  'reddit.com': 'Reddit',
  'www.reddit.com': 'Reddit',
  'old.reddit.com': 'Reddit',
  'linkedin.com': 'LinkedIn',
  'www.linkedin.com': 'LinkedIn',
  'discord.com': 'Discord',
  'www.discord.com': 'Discord',

  // Content & News
  'substack.com': 'Substack',
  'www.substack.com': 'Substack',
  'medium.com': 'Medium',
  'www.medium.com': 'Medium',
  'news.ycombinator.com': 'Hacker News',
  'wikipedia.org': 'Wikipedia',
  'en.wikipedia.org': 'Wikipedia',

  // Google Services
  'google.com': 'Google',
  'www.google.com': 'Google',
  'mail.google.com': 'Gmail',
  'docs.google.com': 'Google Docs',
  'drive.google.com': 'Google Drive',
  'calendar.google.com': 'Google Calendar',
  'meet.google.com': 'Google Meet',
  'gemini.google.com': 'Gemini',

  // AI Tools
  'chatgpt.com': 'ChatGPT',
  'www.chatgpt.com': 'ChatGPT',
  'chat.openai.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'www.claude.ai': 'Claude',
  'code.claude.com': 'Claude Code',

  // Productivity
  'notion.so': 'Notion',
  'www.notion.so': 'Notion',
  'figma.com': 'Figma',
  'www.figma.com': 'Figma',
  'slack.com': 'Slack',
  'app.slack.com': 'Slack',

  // Developer Tools
  'stackoverflow.com': 'Stack Overflow',
  'www.stackoverflow.com': 'Stack Overflow',
  'vercel.com': 'Vercel',
  'www.vercel.com': 'Vercel',
  'npmjs.com': 'npm',
  'www.npmjs.com': 'npm',
  'developer.mozilla.org': 'MDN',

  // Research & ML
  'arxiv.org': 'arXiv',
  'www.arxiv.org': 'arXiv',
  'huggingface.co': 'Hugging Face',
  'www.huggingface.co': 'Hugging Face',

  // Shopping & Commerce
  'amazon.com': 'Amazon',
  'www.amazon.com': 'Amazon',
  'producthunt.com': 'Product Hunt',
  'www.producthunt.com': 'Product Hunt',

  // International
  'xiaohongshu.com': 'RedNote',
  'www.xiaohongshu.com': 'RedNote',

  // Special
  'local-files': 'Local Files',

  // ═══════════════════════════════════════════════════════════════════
  // ADD YOUR CUSTOM DOMAIN MAPPINGS BELOW:
  // ═══════════════════════════════════════════════════════════════════
  // 'internal.mycompany.com': 'Company Portal',
  // 'jira.mycompany.com': 'Bug Tracker',
};

// URL pattern to friendly name mapping (regex-based, for complex URL matching)
// These are checked before FRIENDLY_DOMAINS for URLs that need pattern matching
export const URL_PATTERN_NAMES = [
  // Cloud Consoles
  { pattern: /console\.cloud\.google\.com/, name: 'Google Cloud' },
  { pattern: /portal\.azure\.(com|cn)/, name: 'Azure Portal' },
  { pattern: /console\.aws\.amazon\.com/, name: 'AWS Console' },

  // ═══════════════════════════════════════════════════════════════════
  // ADD YOUR CUSTOM URL PATTERNS BELOW:
  // ═══════════════════════════════════════════════════════════════════
  // { pattern: /dashboard\.mycompany\.com/, name: 'Company Dashboard' },
  // { pattern: /grafana.*\.mycompany\./, name: 'Monitoring' },
];
