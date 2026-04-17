/** 运行时环境信息（来自 Vite import.meta.env） */
export const appEnv = {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  title: import.meta.env.VITE_APP_TITLE,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? ''
} as const
