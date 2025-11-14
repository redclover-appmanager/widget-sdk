# App Manager Widget SDK

[![npm version](https://img.shields.io/npm/v/@roku/widget-sdk.svg)](https://www.npmjs.com/package/@roku/widget-sdk)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@roku/widget-sdk)](https://bundlephobia.com/package/@roku/widget-sdk)

Lightweight JavaScript SDK (~2KB gzipped) for building widgets that integrate with the App Manager platform. Handles authorization, caching, error handling, and lifecycle management out of the box.

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
npm install @roku/widget-sdk
```

## Quick Start

```typescript
import { AppManagerWidget } from '@roku/widget-sdk';

class MyWidget extends AppManagerWidget {
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
class MyWidget extends AppManagerWidget {
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
class MyWidget extends AppManagerWidget {
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
class StatefulWidget extends AppManagerWidget {
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
class ComplexWidget extends AppManagerWidget {
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
class SafeWidget extends AppManagerWidget {
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
class CleanWidget extends AppManagerWidget {
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
  AppManagerWidget,
  WidgetConfig,
  AuthResponse,
  WidgetOptions 
} from '@roku/widget-sdk';

class TypedWidget extends AppManagerWidget {
  private myData: string[] = [];

  async onInit(config: WidgetConfig) {
    this.myData = config.items as string[];
  }

  async onRender(config: WidgetConfig) {
    // Fully typed
  }

  async onDestroy(): Promise<void> {
    // Fully typed
  }
}
```

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
npm link @roku/widget-sdk
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

1. Verify all data attributes are present on the script tag
2. Check that `data-app-manager-url` is correct and accessible
3. Enable debug mode: `options: { debug: true }`
4. Check browser console for errors

### Authorization Failing

1. Verify `data-website-id` and `data-app-id` are correct
2. Ensure the widget is authorized in App Manager
3. Check network tab for failed API requests
4. Try clearing cache: `widget.reload()`

### Cache Issues

```typescript
// Clear cache and reload
const widget = new MyWidget();
await widget.reload();
```

## License

Copyright © Red Clover. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use of this software, via any medium, is strictly prohibited.

---

**Built for App Manager** | [Documentation](https://github.com/redclover-appmanager/widget-sdk) | [Issues](https://github.com/redclover-appmanager/widget-sdk/issues)
