import { WidgetConfig, AuthResponse, WidgetOptions, CreateElementProps } from './types';

/**
 * Abstract base class for building Koru widgets.
 * Handles authorization, caching, lifecycle management, and provides helper utilities.
 * 
 * @example
 * ```typescript
 * class MyWidget extends KoruWidget {
 *   constructor() {
 *     super({ name: 'my-widget', version: '1.0.0' });
 *   }
 * 
 *   async onInit(config) {
 *     // Initialize widget state
 *   }
 * 
 *   async onRender(config) {
 *     // Render widget UI
 *     this.container = this.createElement('div', {
 *       className: 'my-widget',
 *       children: ['Hello World']
 *     });
 *     document.body.appendChild(this.container);
 *   }
 * 
 *   async onDestroy() {
 *     // Cleanup
 *     this.container?.remove();
 *   }
 * }
 * 
 * new MyWidget().start();
 * ```
 */
export abstract class KoruWidget {
  /** Current widget configuration from Koru */
  protected config: WidgetConfig = {};
  /** Full authorization response including app and website metadata */
  protected authData: AuthResponse | null = null;
  /** Main container element for the widget (typically set in onRender) */
  protected container: HTMLElement | null = null;

  private websiteId: string;
  private appId: string;
  private koruUrl: string;
  private widgetName: string;
  private widgetVersion: string;
  private options: Required<NonNullable<WidgetOptions['options']>>;
  private isInitialized = false;

  /**
   * Creates a new widget instance.
   * Extracts configuration from script tag data attributes.
   * 
   * @param widgetOptions - Widget configuration including name, version, and options
   * @throws {Error} If script tag or required data attributes are missing
   * 
   * @example
   * ```typescript
   * constructor() {
   *   super({
   *     name: 'my-widget',
   *     version: '1.0.0',
   *     options: {
   *       cache: true,
   *       debug: true,
   *       analytics: false
   *     }
   *   });
   * }
   * ```
   */
  constructor(widgetOptions: WidgetOptions) {
    this.widgetName = widgetOptions.name;
    this.widgetVersion = widgetOptions.version;

    // Default options
    this.options = {
      cache: true,
      cacheDuration: 3600,
      retryAttempts: 3,
      retryDelay: 1000,
      analytics: false,
      debug: false,
      ...widgetOptions.options
    };

    // Extract params from script tag
    const script = this.getCurrentScript();
    if (!script) {
      throw new Error('[Widget SDK] Could not find script tag');
    }

    this.websiteId = script.getAttribute('data-website-id') || '';
    this.appId = script.getAttribute('data-app-id') || '';
    this.koruUrl = script.getAttribute('data-app-manager-url') || '';

    if (!this.websiteId || !this.appId || !this.koruUrl) {
      throw new Error('[Widget SDK] Missing required data attributes');
    }

    this.log('SDK initialized', { websiteId: this.websiteId, appId: this.appId });
  }

  /**
   * Starts the widget lifecycle.
   * Waits for DOM, authorizes with Koru, then calls onInit and onRender hooks.
   * 
   * @returns Promise that resolves when widget is fully initialized
   * @throws {Error} If authorization fails or lifecycle hooks throw errors
   * 
   * @example
   * ```typescript
   * const widget = new MyWidget();
   * await widget.start();
   * ```
   */
  public async start(): Promise<void> {
    try {
      await this.waitForDOM();
      this.authData = await this.authorize();

      if (!this.authData.authorized) {
        this.log('Widget not authorized');
        return;
      }

      this.config = this.authData.config;
      await this.onInit(this.config);
      await this.onRender(this.config);
      this.isInitialized = true;
      this.log('Widget started successfully');

      if (this.options.analytics) {
        this.track('widget_loaded', {
          widget: this.widgetName,
          version: this.widgetVersion
        });
      }
    } catch (error) {
      this.handleError('Failed to start widget', error);
    }
  }

  /**
   * Stops the widget and performs cleanup.
   * Calls the onDestroy hook to remove DOM elements and event listeners.
   * 
   * @returns Promise that resolves when cleanup is complete
   * 
   * @example
   * ```typescript
   * await widget.stop();
   * ```
   */
  public async stop(): Promise<void> {
    try {
      await this.onDestroy();
      this.isInitialized = false;
      this.log('Widget stopped');
    } catch (error) {
      this.handleError('Failed to stop widget', error);
    }
  }

  /**
   * Reloads the widget with fresh configuration from Koru.
   * Clears cache and re-authorizes. Calls onConfigUpdate if implemented, otherwise re-renders.
   * 
   * @returns Promise that resolves when reload is complete
   * 
   * @example
   * ```typescript
   * // Reload widget when configuration changes
   * await widget.reload();
   * ```
   */
  public async reload(): Promise<void> {
    try {
      this.clearCache();
      this.authData = await this.authorize();

      if (!this.authData.authorized) return;

      const newConfig = this.authData.config;

      if (this.onConfigUpdate) {
        await this.onConfigUpdate(newConfig);
      } else {
        await this.onDestroy();
        await this.onRender(newConfig);
      }

      this.config = newConfig;
      this.log('Widget reloaded');
    } catch (error) {
      this.handleError('Failed to reload widget', error);
    }
  }

  // ==================== LIFECYCLE HOOKS (ABSTRACT) ====================

  /**
   * Lifecycle hook called after successful authorization.
   * Use this to initialize widget state, fetch data, or set up event listeners.
   * 
   * @param config - Widget configuration from Koru
   * @returns Promise or void
   * 
   * @example
   * ```typescript
   * async onInit(config) {
   *   this.apiUrl = config.apiUrl;
   *   this.data = await fetch(this.apiUrl).then(r => r.json());
   * }
   * ```
   */
  protected abstract onInit(config: WidgetConfig): Promise<void> | void;

  /**
   * Lifecycle hook called after onInit to render the widget UI.
   * Create and append DOM elements here.
   * 
   * @param config - Widget configuration from Koru
   * @returns Promise or void
   * 
   * @example
   * ```typescript
   * async onRender(config) {
   *   this.container = this.createElement('div', {
   *     className: 'my-widget',
   *     children: [this.createElement('h1', { children: [config.title] })]
   *   });
   *   document.body.appendChild(this.container);
   * }
   * ```
   */
  protected abstract onRender(config: WidgetConfig): Promise<void> | void;

  /**
   * Lifecycle hook called when the widget is stopped.
   * Clean up event listeners, timers, and remove DOM elements.
   * 
   * @returns Promise or void
   * 
   * @example
   * ```typescript
   * async onDestroy() {
   *   clearInterval(this.timer);
   *   this.container?.remove();
   * }
   * ```
   */
  protected abstract onDestroy(): Promise<void> | void;

  /**
   * Optional lifecycle hook called when widget is reloaded.
   * Implement this to update the UI without a full re-render.
   * If not implemented, onDestroy and onRender will be called instead.
   * 
   * @param config - Updated widget configuration from Koru
   * @returns Promise or void
   * 
   * @example
   * ```typescript
   * async onConfigUpdate(config) {
   *   // Update existing UI elements instead of full re-render
   *   this.titleElement.textContent = config.title;
   * }
   * ```
   */
  protected onConfigUpdate?(config: WidgetConfig): Promise<void> | void;

  // ==================== AUTHORIZATION ====================

  private async authorize(): Promise<AuthResponse> {
    // Check for Koru preview mode first
    if (typeof window !== 'undefined' && window.__KORU_PREVIEW_CONFIG__) {
      this.log('Using Koru preview config');
      return {
        authorized: true,
        config: window.__KORU_PREVIEW_CONFIG__ as WidgetConfig,
        token: 'preview-mode',
        app: {
          id: this.appId,
          name: 'Preview Mode',
          description: 'Widget running in Koru preview mode'
        },
        website: {
          id: this.websiteId,
          url: window.location.origin,
          is_ecommerce: false,
          customer: 'preview'
        }
      };
    }

    if (this.options.cache) {
      const cached = this.getFromCache();
      if (cached) {
        this.log('Using cached authorization');
        return cached;
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        this.log(`Authorization attempt ${attempt}/${this.options.retryAttempts}`);

        const url = `${this.koruUrl}/api/auth/widget?website_id=${this.websiteId}&app_id=${this.appId}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Authorization failed: ${response.status}`);
        }

        const data: AuthResponse = await response.json();

        if (this.options.cache) {
          this.saveToCache(data);
        }

        return data;
      } catch (error) {
        lastError = error as Error;
        this.log(`Authorization attempt ${attempt} failed:`, error);

        if (attempt < this.options.retryAttempts) {
          await this.sleep(this.options.retryDelay);
        }
      }
    }

    throw lastError || new Error('Authorization failed');
  }

  // ==================== HELPER METHODS ====================

  /**
   * Creates a DOM element with the specified tag and properties.
   * Provides a convenient way to build UI elements with type safety.
   * 
   * @template K - HTML element tag name
   * @param tag - HTML tag name (e.g., 'div', 'button', 'span')
   * @param props - Element properties including className, style, onClick, and children
   * @returns The created HTML element
   * 
   * @example
   * ```typescript
   * // Create a button with click handler
   * const button = this.createElement('button', {
   *   className: 'btn btn-primary',
   *   style: { padding: '10px', backgroundColor: 'blue' },
   *   onClick: () => console.log('clicked'),
   *   children: ['Click Me']
   * });
   * 
   * // Create nested elements
   * const card = this.createElement('div', {
   *   className: 'card',
   *   children: [
   *     this.createElement('h2', { children: ['Title'] }),
   *     this.createElement('p', { children: ['Description'] })
   *   ]
   * });
   * ```
   */
  protected createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props?: CreateElementProps<K>
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    if (props) {
      const { className, style, onClick, children, ...rest } = props;

      if (className) element.className = className;
      if (style) Object.assign(element.style, style);
      if (onClick) element.addEventListener('click', onClick as EventListener);
      if (children) {
        children.forEach(child => {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          } else {
            element.appendChild(child);
          }
        });
      }

      Object.assign(element, rest);
    }

    return element;
  }

  /**
   * Detects if the current device is a mobile device.
   * Checks user agent string for common mobile device identifiers.
   * 
   * @returns true if mobile device, false otherwise
   * 
   * @example
   * ```typescript
   * async onRender(config) {
   *   const layout = this.isMobile() ? 'mobile' : 'desktop';
   *   this.container = this.createElement('div', {
   *     className: `widget-${layout}`
   *   });
   * }
   * ```
   */
  protected isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Tracks an analytics event to Koru.
   * Only sends events if analytics option is enabled.
   * 
   * @param eventName - Name of the event to track
   * @param eventData - Optional event metadata
   * 
   * @example
   * ```typescript
   * // Track button click
   * this.track('button_clicked', {
   *   button_id: 'cta',
   *   timestamp: Date.now()
   * });
   * 
   * // Track page view
   * this.track('page_viewed', {
   *   page: 'home'
   * });
   * ```
   */
  protected track(eventName: string, eventData?: Record<string, unknown>): void {
    if (!this.options.analytics) return;

    try {
      const url = `${this.koruUrl}/api/analytics`;

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_id: this.websiteId,
          app_id: this.appId,
          event_type: eventName,
          event_data: {
            widget: this.widgetName,
            version: this.widgetVersion,
            ...eventData
          }
        })
      }).catch(err => this.log('Analytics error:', err));
    } catch (error) {
      this.log('Failed to track event:', error);
    }
  }

  /**
   * Logs a debug message to the console.
   * Only logs if debug option is enabled.
   * 
   * @param message - Message to log
   * @param args - Additional arguments to log
   * 
   * @example
   * ```typescript
   * this.log('Widget initialized', { config: this.config });
   * this.log('Fetching data from', apiUrl);
   * ```
   */
  protected log(message: string, ...args: unknown[]): void {
    if (this.options.debug) {
      console.log(`[${this.widgetName}]`, message, ...args);
    }
  }

  private handleError(message: string, error: unknown): void {
    console.error(`[${this.widgetName}] ${message}:`, error);

    if (this.options.analytics) {
      this.track('widget_error', {
        error: error instanceof Error ? error.message : String(error),
        message
      });
    }
  }

  // ==================== PRIVATE HELPERS ====================

  private getCurrentScript(): HTMLScriptElement | null {
    return document.currentScript as HTMLScriptElement;
  }

  private async waitForDOM(): Promise<void> {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', () => resolve());
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(): string {
    return `koru_widget_${this.websiteId}_${this.appId}`;
  }

  private getFromCache(): AuthResponse | null {
    try {
      const key = this.getCacheKey();
      const cached = localStorage.getItem(key);

      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = (Date.now() - timestamp) / 1000;

      if (age > this.options.cacheDuration) {
        this.clearCache();
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private saveToCache(data: AuthResponse): void {
    try {
      const key = this.getCacheKey();
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      this.log('Failed to cache auth data:', error);
    }
  }

  private clearCache(): void {
    try {
      const key = this.getCacheKey();
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
}
