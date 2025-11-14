export interface WidgetConfig {
  [key: string]: any;
}

export interface AuthResponse {
  authorized: boolean;
  config: WidgetConfig;
  token: string;
  app: {
    id: string;
    name: string;
    description: string;
  };
  website: {
    id: string;
    url: string;
    is_ecommerce: boolean;
    customer: string;
  };
}

export interface WidgetOptions {
  name: string;
  version: string;
  options?: {
    cache?: boolean;
    cacheDuration?: number;
    retryAttempts?: number;
    retryDelay?: number;
    analytics?: boolean;
    debug?: boolean;
  };
}
