/* ================================================================
   Tab Out — Configuration Constants

   Centralized configuration for all tunable values.
   Edit this file to customize behavior without modifying core logic.

   Pattern follows domain-names.js - import what you need:
   import { SEARCH_CONFIG, SCORE_WEIGHTS } from './constants.js';
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   SEARCH CONFIGURATION
   ---------------------------------------------------------------- */

export const SEARCH_CONFIG = {
  // Maximum items shown before "Show more" collapse
  maxInitialItems: 2,

  // Debounce delay for search input (ms)
  debounceDelay: 150,

  // History search: only include items from last N days
  maxHistoryDays: 90,

  // Maximum history results from Chrome API
  maxHistoryResults: 50,

  // Fuse.js fuzzy search settings
  fuseThreshold: 0.4,      // 0 = exact match, 1 = match anything
  fuseDistance: 100,       // Max character distance for match
  fuseMinMatchLength: 2,   // Minimum characters to trigger match
};

/* ----------------------------------------------------------------
   SCORE WEIGHTS
   Scoring system: higher = more relevant
   ---------------------------------------------------------------- */

export const SCORE_WEIGHTS = {
  // Type multipliers (applied to base match score)
  tab: 2.0,           // Open tabs are most relevant
  bookmark: 1.3,      // Bookmarks are intentionally saved
  history: 0.8,       // History is ambient

  // Pin score ranges (pins always appear at top)
  pinBase: 9000,      // Minimum pin score
  pinExact: 10000,    // Exact match on custom name
  pinCustomPrefix: { min: 9600, range: 300 },  // Custom name starts with query
  pinCustomContains: 9500,   // Custom name contains query
  pinKeywordExact: 9400,     // Keyword exact match
  pinKeywordPrefix: { min: 9000, range: 300 }, // Keyword prefix match
  pinKeywordContains: 8500,  // Query contains keyword
  pinTitleUrl: 9100,         // Title/URL contains query

  // Single keyword match scores (before type multiplier)
  titleExact: 100,
  titlePrefix: 80,
  titleContains: 50,
  titleFuzzy: 30,
  urlDomain: 60,
  urlContains: 40,

  // Multi-keyword scoring
  multiKeywordTitle: 40,     // Points per keyword found in title
  multiKeywordUrl: 20,       // Points per keyword found in URL
  multiKeywordAllInTitle: 30, // Bonus if all keywords in title
  multiKeywordOrder: 20,      // Bonus for keyword order preservation

  // Recency multipliers (for history items)
  recencyToday: 1.5,
  recencyWeek: 1.3,
  recencyMonth: 1.1,

  // Frequency multiplier cap (logarithmic scale)
  frequencyMax: 1.6,
  frequencyScale: 0.3,
};

/* ----------------------------------------------------------------
   BADGE CONFIGURATION
   Toolbar badge color thresholds
   ---------------------------------------------------------------- */

export const BADGE_CONFIG = {
  thresholds: {
    low: 10,      // Green badge: 1-10 tabs
    medium: 20,   // Amber badge: 11-20 tabs
                  // Red badge: 21+ tabs
  },
  colors: {
    low: '#3d7a4a',     // Green - focused, manageable
    medium: '#b8892e',  // Amber - getting busy
    high: '#b35a5a',    // Red - time to cull
  },
};

/* ----------------------------------------------------------------
   TIMING
   Animation and delay values (ms)
   ---------------------------------------------------------------- */

export const TIMING = {
  // Toast notification
  toastDuration: 2500,    // How long toast is visible
  toastFadeOut: 200,      // Fade out animation duration

  // Tab operations
  tabGroupDelay: 100,     // Delay before adding tab to group
};

/* ----------------------------------------------------------------
   BROWSER INTERNAL URL PREFIXES
   URLs starting with these are filtered out as "not real tabs"
   ---------------------------------------------------------------- */

export const BROWSER_INTERNAL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'brave://',
];

/* ----------------------------------------------------------------
   TLD LIST
   Top-level domains to strip from display names
   ---------------------------------------------------------------- */

export const TLD_LIST = [
  'com', 'org', 'net', 'io', 'co', 'ai', 'dev', 'app',
  'so', 'me', 'xyz', 'info', 'us', 'uk', 'co.uk', 'co.jp',
];

/* ----------------------------------------------------------------
   STOP WORDS
   Common words filtered during keyword extraction
   ---------------------------------------------------------------- */

export const STOP_WORDS = {
  // Filtered from URL parts
  url: [
    'www', 'com', 'org', 'net',
    'index', 'html', 'page', 'view', 'api', 'v1', 'v2',
  ],

  // Filtered from titles
  title: [
    'the', 'and', 'for', 'with', 'from', 'this', 'that',
  ],
};

/* ----------------------------------------------------------------
   TAB GROUP COLORS
   Chrome's official tab group color palette
   ---------------------------------------------------------------- */

export const TAB_GROUP_COLORS = {
  grey: '#9aa0a6',
  blue: '#4285f4',
  red: '#ea4335',
  yellow: '#fbbc04',
  green: '#34a853',
  pink: '#f538a0',
  purple: '#a142f4',
  cyan: '#24c1e0',
  orange: '#fa903e',
};
