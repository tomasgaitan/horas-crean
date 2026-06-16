/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_PIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
