// Complete Vite type declarations to avoid import errors
declare module 'vite' {
  export function createServer(options?: any): Promise<any>;
  export function createLogger(level?: string, options?: any): any;
  export function defineConfig(config: any): any;
  export function build(options?: any): Promise<any>;
  
  export interface ServerOptions {
    middlewareMode?: boolean | 'html' | 'ssr';
    hmr?: boolean | {
      server?: any;
      port?: number;
      host?: string;
    };
    allowedHosts?: boolean | string[];
    [key: string]: any;
  }
  
  export interface UserConfig {
    server?: ServerOptions;
    [key: string]: any;
  }
  
  // Re-export all common Vite types as any to prevent errors
  export const loadEnv: any;
  export const mergeConfig: any;
  export const normalizePath: any;
  export const resolveConfig: any;
  export const transformWithEsbuild: any;
}