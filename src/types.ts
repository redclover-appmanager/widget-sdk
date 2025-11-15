/**
 * Configuration object passed to widget lifecycle hooks.
 * Contains custom configuration data from the Koru platform.
 * 
 * @example
 * ```typescript
 * async onInit(config: WidgetConfig) {
 *   const apiUrl = config.apiUrl as string;
 *   const items = config.items as Array<any>;
 * }
 * ```
 */
export interface WidgetConfig {
  [key: string]: any;
}

/**
 * Response from the Koru authorization endpoint.
 * Contains authorization status, widget configuration, and metadata.
 */
export interface AuthResponse {
  /** Whether the widget is authorized to run */
  authorized: boolean;
  /** Custom configuration data for the widget */
  config: WidgetConfig;
  /** Authorization token for authenticated requests */
  token: string;
  /** App metadata from Koru */
  app: {
    /** Unique app identifier */
    id: string;
    /** Human-readable app name */
    name: string;
    /** App description */
    description: string;
  };
  /** Website metadata from Koru */
  website: {
    /** Unique website identifier */
    id: string;
    /** Website URL */
    url: string;
    /** Whether the website is an e-commerce site */
    is_ecommerce: boolean;
    /** Customer identifier */
    customer: string;
  };
}

/**
 * Options for configuring a widget instance.
 * 
 * @example
 * ```typescript
 * class MyWidget extends KoruWidget {
 *   constructor() {
 *     super({
 *       name: 'my-widget',
 *       version: '1.0.0',
 *       options: {
 *         cache: true,
 *         cacheDuration: 3600,
 *         debug: true
 *       }
 *     });
 *   }
 * }
 * ```
 */
export interface WidgetOptions {
  /** Unique identifier for the widget (e.g., 'my-widget') */
  name: string;
  /** Semantic version string (e.g., '1.0.0') */
  version: string;
  /** Optional configuration settings */
  options?: {
    /** Enable localStorage caching of authorization data (default: true) */
    cache?: boolean;
    /** Cache time-to-live in seconds (default: 3600) */
    cacheDuration?: number;
    /** Number of authorization retry attempts (default: 3) */
    retryAttempts?: number;
    /** Delay between retries in milliseconds (default: 1000) */
    retryDelay?: number;
    /** Enable analytics event tracking (default: false) */
    analytics?: boolean;
    /** Enable debug console logging (default: false) */
    debug?: boolean;
  };
}

/**
 * Props for creating DOM elements with the createElement helper.
 * Provides convenience properties for common element configuration.
 * 
 * @template K - HTML element tag name
 */
export type CreateElementProps<K extends keyof HTMLElementTagNameMap> = 
  Partial<HTMLElementTagNameMap[K]> & {
    /** CSS class name(s) to apply */
    className?: string;
    /** Inline styles to apply */
    style?: Partial<CSSStyleDeclaration>;
    /** Click event handler */
    onClick?: (e: MouseEvent) => void;
    /** Child elements or text nodes */
    children?: (HTMLElement | string)[];
  };
