/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-svg-loader" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_APP_CLIENT_ID: string
}

interface Error {
  cause?: unknown,
  code?: string
}
