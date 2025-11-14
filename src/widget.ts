import { WidgetConfig, AuthResponse, WidgetOptions } from './types';

export abstract class AppManagerWidget {
  protected config: WidgetConfig = {};
  protected authData: AuthResponse | null = null;
  protected container: HTMLElement | null = null;
  
  private websiteId: string;
  private appId: string;
  private appManagerUrl: string;
  private widgetName: string;
  private widgetVersion: string;
  private options: Required<WidgetOptions['options']>;
  private isInitialized = false;

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
    this.appManagerUrl = script.getAttribute('data-app-manager-url') || '';

    if (!this.websiteId || !this.appId || !this.appManagerUrl) {
      throw new Error('[Widget SDK] Missing required data attributes');
    }

    this.log('SDK initialized', { websiteId: this.websiteId, appId: this.appId });
  }

  /**
   * Start the widget lifecycle
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
   * Stop and cleanup the widget
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
   * Reload widget with fresh config
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

  protected abstract onInit(config: WidgetConfig): Promise<void> | void;
  protected abstract onRender(config: WidgetConfig): Promise<void> | void;
  protected abstract onDestroy(): Promise<void> | void;
  protected onConfigUpdate?(config: WidgetConfig): Promise<void> | void;

  // ==================== AUTHORIZATION ====================

  private async authorize(): Promise<AuthResponse> {
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
        
        const url = `${this.appManagerUrl}/api/widget/authorize?website_id=${this.websiteId}&app_id=${this.appId}`;
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

  protected createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props?: Partial<HTMLElementTagNameMap[K]> & {
      className?: string;
      style?: Partial<CSSStyleDeclaration>;
      onClick?: (e: MouseEvent) => void;
      children?: (HTMLElement | string)[];
    }
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

  protected isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  protected track(eventName: string, eventData?: Record<string, any>): void {
    if (!this.options.analytics) return;

    try {
      const url = `${this.appManagerUrl}/api/widget/analytics`;
      
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

  protected log(message: string, ...args: any[]): void {
    if (this.options.debug) {
      console.log(`[${this.widgetName}]`, message, ...args);
    }
  }

  private handleError(message: string, error: any): void {
    console.error(`[${this.widgetName}] ${message}:`, error);
    
    if (this.options.analytics) {
      this.track('widget_error', {
        error: error?.message || String(error),
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
    return `appmanager_widget_${this.websiteId}_${this.appId}`;
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
