import request from '@/utils/request'

// ==================== 类型定义 ====================

export interface Prize {
  id: number
  name: string
  type: number
  imageUrl: string
  value: string
}

export interface DrawPageInfo {
  prizes: Prize[]
  remainingQuota: number
  totalQuota: number
  usedQuota: number
  recentWinNotices: string[]
}

export interface DrawResult {
  success: boolean
  recordNo?: string
  prizeId?: number
  prizeName?: string
  prizeType?: number
  prizeValue?: string
  win: boolean
  message: string
  remainingQuota?: number
}

export interface DrawRequest {
  userId: string
  poolId: number
}

// ==================== API 接口 ====================

const API_BASE = '/api/v1/draw'

/**
 * 获取抽奖页面信息（奖品列表 + 用户次数 + 中奖通知）
 */
export function getDrawPageInfo(userId: string, poolId: number) {
  return request.get<DrawPageInfo>(`${API_BASE}/info`, {
    params: { userId, poolId }
  })
}

/**
 * 执行抽奖
 */
export function executeDraw(data: DrawRequest) {
  return request.post<DrawResult>(`${API_BASE}/execute`, data)
}

// ==================== 兼容旧接口（用于平滑迁移）====================

export interface QuotaInfo {
  total: number
  used: number
  remaining: number
}

export function getPrizeList(poolId: number) {
  return request.get<Prize[]>(`/lottery/prizes/${poolId}`)
}

export function getNotices() {
  return request.get<Array<{ user: string; prize: string }>>('/lottery/notices')
}

export function getQuota(poolId: number) {
  return request.get<QuotaInfo>(`/lottery/quota/${poolId}`)
}

export function draw(poolId: number) {
  return request.post<DrawResult>('/lottery/draw', { poolId })
}