# Koru Widget SDK

[![npm version](https://img.shields.io/npm/v/@koru/widget-sdk.svg)](https://www.npmjs.com/package/@koru/widget-sdk)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@koru/widget-sdk)](https://bundlephobia.com/package/@koru/widget-sdk)

Lightweight JavaScript SDK (~2KB gzipped) for building widgets that integrate with the Koru platform. Handles authorization, caching, error handling, and lifecycle management out of the box.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [HTML Integration](#html-integration)
- [API Reference](#api-reference)
  - [Constructor Options](#constructor-options)
  - [Lifecycle Hooks](#lifecycle-hooks)
  - [Helper Methods](#helper-methods)
  - [Public Methods](#public-methods)
  - [Protected Properties](#protected-properties)
- [Advanced Examples](#advanced-examples)
- [TypeScript Support](#typescript)
- [IDE Setup](#ide-setup)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Features

- 🪶 **Lightweight** - Only 2.1KB gzipped
- 🚀 **Zero Dependencies** - No external runtime dependencies
- 📦 **Multiple Formats** - CommonJS, ESM, and UMD builds
- 🔒 **Smart Caching** - LocalStorage with configurable TTL
- 🔄 **Retry Logic** - Automatic authorization retries
- 📊 **Analytics Ready** - Built-in event tracking
- 📱 **Mobile Detection** - Responsive widget helpers
- 🎯 **TypeScript** - Full type definitions included

## Installation

```bash
npm install @koru/widget-sdk
```

## Quick Start

```typescript
import { KoruWidget } from '@koru/widget-sdk';

class MyWidget extends KoruWidget {
  constructor() {
    super({ name: 'my-widget', version: '1.0.0' });
  }

  async onInit(config) {
    // Setup logic - runs after authorization
    console.log('Widget config:', config);
  }

  async onRender(config) {
    // Render your widget UI
    this.container = this.createElement('div', {
      className: 'my-widget',
      children: [
        this.createElement('h1', { children: ['Hello World!'] }),
        this.createElement('button', {
          children: ['Click Me'],
          onClick: () => this.track('button_clicked')
        })
      ]
    });
    document.body.appendChild(this.container);
  }

  async onDestroy() {
    // Cleanup when widget is removed
    this.container?.remove();
  }
}

// Start the widget
new MyWidget().start();
```

## HTML Integration

Add the widget script tag with required data attributes:

```html
<script 
  src="https://cdn.example.com/my-widget.js"
  data-website-id="your-website-id"
  data-app-id="your-app-id"
  data-app-manager-url="https://app-manager.example.com"
></script>
```

## API Reference

### Constructor Options

```typescript
class MyWidget extends KoruWidget {
  constructor() {
    super({ 
      name: 'widget-name',        // Required: Widget identifier
      version: '1.0.0',            // Required: Widget version
      options: {
        cache: true,               // Enable caching (default: true)
        cacheDuration: 3600,       // Cache TTL in seconds (default: 3600)
        retryAttempts: 3,          // Auth retry attempts (default: 3)
        retryDelay: 1000,          // Retry delay in ms (default: 1000)
        analytics: false,          // Enable analytics (default: false)
        debug: false               // Enable debug logs (default: false)
      }
    });
  }
}
```

### Lifecycle Hooks

| Hook | When Called | Purpose |
|------|-------------|---------|
| `onInit(config)` | After authorization | Initialize widget state |
| `onRender(config)` | After init | Render widget UI |
| `onDestroy()` | On widget stop | Cleanup resources |
| `onConfigUpdate(config)` | On reload (optional) | Update without full re-render |

**Example:**

```typescript
class MyWidget extends KoruWidget {
  async onInit(config) {
    // Setup event listeners, fetch data, etc.
    this.data = await this.fetchData(config.apiUrl);
  }

  async onRender(config) {
    // Create and append DOM elements
    this.container = this.createElement('div', {
      className: 'widget',
      children: this.renderContent(config)
    });
    document.body.appendChild(this.container);
  }

  async onConfigUpdate(config) {
    // Optional: Update existing UI without full re-render
    this.updateContent(config);
  }

  async onDestroy() {
    // Remove event listeners, clear timers, remove DOM
    this.container?.remove();
  }
}
```

### Helper Methods

#### `createElement(tag, props)`

Create DOM elements with properties:

```typescript
const button = this.createElement('button', {
  className: 'btn btn-primary',
  style: { padding: '10px', color: 'white' },
  onClick: (e) => console.log('clicked'),
  children: ['Click Me', icon]
});
```

#### `isMobile()`

Detect mobile devices:

```typescript
async onRender(config) {
  const layout = this.isMobile() ? 'mobile' : 'desktop';
  this.container = this.createElement('div', {
    className: `widget-${layout}`
  });
}
```

#### `track(eventName, eventData)`

Track analytics events (requires `analytics: true`):

```typescript
this.track('button_clicked', {
  button_id: 'cta',
  timestamp: Date.now()
});
```

#### `log(message, ...args)`

Debug logging (requires `debug: true`):

```typescript
this.log('Rendering widget', { config });
```

### Public Methods

```typescript
const widget = new MyWidget();

await widget.start();   // Initialize and start widget
await widget.stop();    // Stop and cleanup widget
await widget.reload();  // Reload with fresh config (clears cache)
```

### Protected Properties

```typescript
this.config      // Current widget configuration
this.authData    // Full authorization response
this.container   // Main container element (set in onRender)
```

## Advanced Examples

### State Management

```typescript
class StatefulWidget extends KoruWidget {
  private state = {
    count: 0,
    items: []
  };

  async onRender(config) {
    this.state.items = config.items || [];
    this.render();
  }

  private render() {
    if (this.container) this.container.remove();

    this.container = this.createElement('div', {
      children: [
        this.createElement('p', { 
          children: [`Count: ${this.state.count}`] 
        }),
        this.createElement('button', {
          children: ['Increment'],
          onClick: () => {
            this.state.count++;
            this.render();
          }
        })
      ]
    });
    document.body.appendChild(this.container);
  }
}
```

### Complex UI

```typescript
class ComplexWidget extends KoruWidget {
  async onRender(config) {
    const header = this.createElement('header', {
      className: 'widget-header',
      children: [
        this.createElement('h1', { children: [config.title] }),
        this.createElement('p', { children: [config.description] })
      ]
    });

    const list = this.createElement('ul', {
      className: 'widget-list',
      children: config.items.map(item => 
        this.createElement('li', {
          children: [item.name],
          onClick: () => this.handleItemClick(item)
        })
      )
    });

    this.container = this.createElement('div', {
      className: 'complex-widget',
      children: [header, list]
    });

    document.body.appendChild(this.container);
  }

  private handleItemClick(item) {
    this.track('item_clicked', { item_id: item.id });
  }
}
```

### Error Handling

```typescript
class SafeWidget extends KoruWidget {
  async onRender(config) {
    try {
      this.renderContent(config);
    } catch (error) {
      this.log('Render error:', error);
      this.renderErrorState();
    }
  }

  private renderErrorState() {
    this.container = this.createElement('div', {
      className: 'widget-error',
      children: ['Failed to load widget. Please try again.']
    });
    document.body.appendChild(this.container);
  }
}
```

### Proper Cleanup

```typescript
class CleanWidget extends KoruWidget {
  private timers: number[] = [];
  private listeners: Array<{
    element: HTMLElement;
    event: string;
    handler: EventListener;
  }> = [];

  async onRender(config) {
    const button = this.createElement('button', {
      children: ['Click']
    });

    const handler = () => console.log('clicked');
    button.addEventListener('click', handler);
    this.listeners.push({ element: button, event: 'click', handler });

    const timer = setInterval(() => this.update(), 1000);
    this.timers.push(timer);

    this.container = this.createElement('div', {
      children: [button]
    });
    document.body.appendChild(this.container);
  }

  async onDestroy() {
    // Clean up event listeners
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    
    // Clear timers
    this.timers.forEach(timer => clearInterval(timer));
    
    // Remove DOM
    this.container?.remove();
  }
}
```

## TypeScript

Full TypeScript support with included type definitions:

```typescript
import { 
  KoruWidget,
  WidgetConfig,
  AuthResponse,
  WidgetOptions,
  CreateElementProps
} from '@koru/widget-sdk';

class TypedWidget extends KoruWidget {
  private myData: string[] = [];
  private container!: HTMLDivElement;

  async onInit(config: WidgetConfig) {
    // Type-safe config access
    this.myData = config.items as string[];
  }

  async onRender(config: WidgetConfig) {
    // Full type inference for createElement
    this.container = this.createElement('div', {
      className: 'typed-widget',
      style: { padding: '20px' },
      children: [
        this.createElement('h1', { 
          children: [config.title as string] 
        })
      ]
    });
    document.body.appendChild(this.container);
  }

  async onDestroy(): Promise<void> {
    this.container?.remove();
  }
}
```

### Type Definitions

The SDK exports the following types for enhanced IDE support:

- **`KoruWidget`** - Abstract base class for widgets
- **`WidgetConfig`** - Configuration object from Koru
- **`AuthResponse`** - Full authorization response with metadata
- **`WidgetOptions`** - Constructor options for widget configuration
- **`CreateElementProps<K>`** - Generic props for createElement helper

## IDE Setup

### VS Code

For optimal development experience in VS Code:

1. **Install recommended extensions:**
   - ESLint
   - TypeScript and JavaScript Language Features (built-in)
   - IntelliCode

2. **Enable IntelliSense:**
   The SDK includes full JSDoc comments and TypeScript definitions. IntelliSense will automatically show:
   - Method signatures and descriptions
   - Parameter types and documentation
   - Return types
   - Usage examples

3. **Type checking:**
   ```json
   // Add to your tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

### WebStorm / IntelliJ IDEA

WebStorm provides excellent TypeScript support out of the box:

1. TypeScript definitions are automatically recognized
2. JSDoc comments appear in quick documentation (Ctrl+Q / Cmd+J)
3. Parameter hints show inline while typing

### Auto-completion Features

The SDK provides rich autocomplete for:

- **Lifecycle hooks** - Shows required and optional hooks with documentation
- **Helper methods** - `createElement`, `isMobile`, `track`, `log` with examples
- **Configuration options** - All constructor options with defaults
- **Element creation** - Type-safe HTML element creation with proper props

## Development

### Build

```bash
npm run build
```

Generates:
- `dist/index.js` - CommonJS build
- `dist/index.mjs` - ESM build  
- `dist/widget-sdk.min.js` - UMD build (2.1KB gzipped)
- `dist/index.d.ts` - TypeScript definitions

### Watch Mode

```bash
npm run dev
```

### Local Testing

```bash
npm link
# In your widget project:
npm link @koru/widget-sdk
```

## Publishing

```bash
npm login
npm publish --access restricted
```

## Bundle Size

- **UMD (minified)**: 5.4KB (2.1KB gzipped)
- **ESM**: 11KB
- **CommonJS**: 11KB

## Browser Support

- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+

Requires ES2015+ support, fetch API, and localStorage.

## Troubleshooting

### Widget Not Loading

**Symptoms:** Widget doesn't appear on the page

**Solutions:**
1. Verify all data attributes are present on the script tag:
   ```html
   <script 
     src="your-widget.js"
     data-website-id="your-website-id"
     data-app-id="your-app-id"
     data-app-manager-url="https://app-manager.example.com"
   ></script>
   ```
2. Check that `data-app-manager-url` is correct and accessible
3. Enable debug mode to see detailed logs:
   ```typescript
   super({ name: 'my-widget', version: '1.0.0', options: { debug: true } });
   ```
4. Check browser console for errors
5. Verify the script is loading (check Network tab)

### Authorization Failing

**Symptoms:** Widget loads but doesn't render, console shows authorization errors

**Solutions:**
1. Verify `data-website-id` and `data-app-id` are correct
2. Ensure the widget is authorized in Koru dashboard
3. Check network tab for failed API requests (look for 401/403 errors)
4. Verify the Koru URL is accessible from the browser
5. Try clearing cache and reloading:
   ```typescript
   const widget = new MyWidget();
   await widget.reload();
   ```

### Cache Issues

**Symptoms:** Widget shows old data after configuration changes

**Solutions:**
```typescript
// Option 1: Reload widget (clears cache automatically)
const widget = new MyWidget();
await widget.reload();

// Option 2: Disable caching during development
super({ 
  name: 'my-widget', 
  version: '1.0.0',
  options: { cache: false }
});

// Option 3: Reduce cache duration
super({ 
  name: 'my-widget', 
  version: '1.0.0',
  options: { cacheDuration: 60 } // 1 minute
});
```

### TypeScript Errors

**Symptoms:** Type errors in IDE or during build

**Solutions:**
1. Ensure TypeScript version is 4.0 or higher:
   ```bash
   npm install -D typescript@latest
   ```
2. Check that types are properly imported:
   ```typescript
   import { KoruWidget, WidgetConfig } from '@koru/widget-sdk';
   ```
3. Enable strict mode in `tsconfig.json` for better type safety

### CORS Errors

**Symptoms:** Network requests fail with CORS errors

**Solutions:**
1. Verify Koru is configured to allow requests from your domain
2. Check that the `data-app-manager-url` uses the correct protocol (https)
3. Contact Koru administrator to whitelist your domain

### Memory Leaks

**Symptoms:** Page becomes slow over time, high memory usage

**Solutions:**
1. Ensure proper cleanup in `onDestroy`:
   ```typescript
   async onDestroy() {
     // Remove event listeners
     this.button?.removeEventListener('click', this.handleClick);
     
     // Clear timers
     clearInterval(this.timer);
     
     // Remove DOM elements
     this.container?.remove();
   }
   ```
2. Avoid creating circular references
3. Use WeakMap/WeakSet for object references when appropriate

## Best Practices

### 1. Always Clean Up Resources

```typescript
class BestPracticeWidget extends KoruWidget {
  private timers: number[] = [];
  private listeners: Map<HTMLElement, { event: string; handler: EventListener }> = new Map();

  protected addListener(element: HTMLElement, event: string, handler: EventListener) {
    element.addEventListener(event, handler);
    this.listeners.set(element, { event, handler });
  }

  async onDestroy() {
    // Clean up all listeners
    this.listeners.forEach(({ event, handler }, element) => {
      element.removeEventListener(event, handler);
    });
    this.listeners.clear();

    // Clear all timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];

    // Remove DOM
    this.container?.remove();
  }
}
```

### 2. Use Debug Mode During Development

```typescript
const isDev = process.env.NODE_ENV === 'development';

super({
  name: 'my-widget',
  version: '1.0.0',
  options: {
    debug: isDev,
    cache: !isDev, // Disable cache in development
    analytics: !isDev // Disable analytics in development
  }
});
```

### 3. Type Your Configuration

```typescript
interface MyWidgetConfig extends WidgetConfig {
  apiUrl: string;
  title: string;
  items: Array<{ id: string; name: string }>;
}

class MyWidget extends KoruWidget {
  async onInit(config: WidgetConfig) {
    const typedConfig = config as MyWidgetConfig;
    // Now you have type safety
    console.log(typedConfig.apiUrl);
  }
}
```

### 4. Handle Errors Gracefully

```typescript
class RobustWidget extends KoruWidget {
  async onRender(config: WidgetConfig) {
    try {
      await this.renderContent(config);
    } catch (error) {
      this.log('Render error:', error);
      this.renderErrorState();
    }
  }

  private renderErrorState() {
    this.container = this.createElement('div', {
      className: 'widget-error',
      style: { padding: '20px', color: 'red' },
      children: ['Failed to load widget. Please refresh the page.']
    });
    document.body.appendChild(this.container);
  }
}
```

### 5. Optimize for Performance

```typescript
// Use onConfigUpdate for partial updates instead of full re-render
async onConfigUpdate(config: WidgetConfig) {
  // Only update changed elements
  if (this.titleElement) {
    this.titleElement.textContent = config.title as string;
  }
  // Much faster than destroying and re-rendering
}

// Debounce frequent operations
private debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as unknown as number;
  };
}
```

## License

Copyright © Red Clover. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use of this software, via any medium, is strictly prohibited.

## Contributing

This is a proprietary SDK. For bug reports or feature requests, please contact the Red Clover team.

## Support

For support, please reach out to:
- **Email:** support@redclover.com
- **Documentation:** [GitHub Repository](https://github.com/redclover-appmanager/widget-sdk)
- **Issues:** [GitHub Issues](https://github.com/redclover-appmanager/widget-sdk/issues)

---

**Built for Koru** | [Documentation](https://github.com/redclover-appmanager/widget-sdk) | [Issues](https://github.com/redclover-appmanager/widget-sdk/issues)
