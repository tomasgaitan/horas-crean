/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPS_SCRIPT_URL?: string
  readonly VITE_DEFAULT_PIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
