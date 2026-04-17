import { describe, expect, it } from 'vitest'
import { appEnv } from './env'

describe('appEnv', () => {
  it('暴露 Vite 注入的标题与模式', () => {
    expect(appEnv.title).toBeTruthy()
    expect(['development', 'test', 'production']).toContain(appEnv.mode)
  })
})
