# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-27

### Added
- **Koru Preview Mode Support**: Widgets now check for `window.__KORU_PREVIEW_CONFIG__` before making API authorization calls
  - Enables live preview functionality in Koru platform
  - When preview config is present, widget uses it directly instead of fetching from API
  - Added global `Window` interface declaration for TypeScript support
  - Preview mode is automatically detected with no configuration required

### Changed
- Authorization flow now prioritizes preview config check before cache and API calls

## [1.0.0] - 2025-11-14

### Added
- Initial release of Koru Widget SDK
- Abstract `KoruWidget` base class with lifecycle management
- Authorization with smart caching and retry logic
- Lifecycle hooks: `onInit`, `onRender`, `onDestroy`, `onConfigUpdate`
- Helper methods: `createElement`, `isMobile`, `track`, `log`
- TypeScript support with full type definitions
- Configurable options for caching, retries, analytics, and debugging
- Analytics event tracking
- Mobile device detection
