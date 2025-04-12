/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TESTING: string;
  readonly VITE_PERFORMANCE_OPTIMIZER_ENABLED: string;
  readonly VITE_PERFORMANCE_MONITOR_ENABLED: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
