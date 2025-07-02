// Type overrides for Vite configuration compatibility
declare module 'vite' {
  interface ServerOptions {
    middlewareMode?: boolean | 'html' | 'ssr';
    hmr?: boolean | {
      server?: any;
      port?: number;
      host?: string;
    };
    allowedHosts?: boolean | string[];
  }
}