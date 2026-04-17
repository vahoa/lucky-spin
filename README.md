# lucky-spin · 幸运抽大奖前端

> 基于 **Vue 3 + TypeScript + GSAP** 的横向老虎机抽奖组件

---

## 界面预览

```
┌─────────────────────────────────────────────────────────┐
│  幸运抽大奖   🔊 恭喜用户M**，抽中3积分          我的奖品 >│
│                                                         │
│  ◀ [会员] [3积分] [1积分] [华为Mate X7] [大疆] [华为手表] ▶│
│                              ↑ 当前高亮（动画滚动选中）   │
│                                                         │
│                    ┌──────────────┐                     │
│                    │   立即抽奖   │                     │
│                    └──────────────┘                     │
│                       剩余 3 次                         │
└─────────────────────────────────────────────────────────┘
```

**界面核心组件**

| 组件 | 描述 |
|------|------|
| 标题栏 | "幸运抽大奖" + 跑马灯式中奖滚动通知 |
| 奖品展示区 | 横向老虎机滑动卡片，GSAP驱动抽奖动画 |
| 抽奖按钮 | 渐变红色按钮，含剩余次数提示 |
| 中奖弹窗 | 模态框展示奖品，含粒子动画特效 |
| 操作引导 | "去查看"按钮引导用户进入奖品页 |

---

## 技术栈

- **Vue 3** — 组合式 API，响应式状态管理
- **TypeScript** — 类型安全
- **GSAP** — 高性能动画库，驱动老虎机滚动效果
- **Axios** — HTTP 请求封装
- **Vue Router** — 单页路由

---

## 项目结构

```
lucky-spin/
├── src/
│   ├── views/
│   │   └── LotteryView.vue       # 抽奖主页面（老虎机核心组件）
│   ├── api/
│   │   └── lottery.ts            # API调用层
│   ├── router/
│   │   └── index.ts              # 路由配置
│   ├── utils/
│   │   └── request.ts            # Axios 封装
│   ├── styles/
│   │   └── main.scss             # 全局样式
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 核心功能

### 1. 横向老虎机动画

使用 GSAP 实现三阶段动画：加速 → 匀速 → 减速

```typescript
function playDrawAnimation() {
  gsap.timeline()
    .to(prizeListRef.value, { 
      x: -itemWidth * 5, 
      duration: 0.5, 
      ease: 'power1.in'      // 加速
    })
    .to(prizeListRef.value, { 
      x: -itemWidth * 20, 
      duration: 2, 
      ease: 'none'           // 匀速
    })
    .to(prizeListRef.value, { 
      x: -itemWidth * targetIndex, 
      duration: 0.5, 
      ease: 'power2.out'     // 减速停止
    })
}
```

### 2. 抽奖流程

```typescript
async function startDraw() {
  // 1. 播放老虎机动画
  playDrawAnimation()
  
  // 2. 调用后端API
  const result = await lotteryApi.executeDraw({ userId, poolId })
  
  // 3. 保证动画至少播放3秒
  await delay(Math.max(0, 3000 - elapsed))
  
  // 4. 展示中奖结果
  if (result.success) {
    winPrize.value = result.prize
    showModal.value = true
    showAnimation.value = true  // 粒子动画
  }
}
```

### 3. 跑马灯通知

顶部滚动展示其他用户中奖信息，营造氛围：

```vue
<div class="marquee-container">
  <div class="marquee-content" :style="marqueeStyle">
    <span v-for="(msg, index) in notices" :key="index" class="notice-item">
      {{ msg }}
    </span>
  </div>
</div>
```

---

## API 接口

### GET `/api/v1/draw/info` — 获取抽奖页面信息

```typescript
interface DrawPageInfo {
  prizes: Prize[]              // 奖品列表
  remainingQuota: number       // 剩余次数
  totalQuota: number           // 总次数
  usedQuota: number            // 已用次数
  recentWinNotices: string[]   // 最近中奖通知
}
```

### POST `/api/v1/draw/execute` — 执行抽奖

```typescript
interface DrawRequest {
  userId: string
  poolId: number
}

interface DrawResult {
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
```

---

## 快速启动

```bash
# 安装依赖
npm install

# 开发环境
npm run dev

# 构建
npm run build

# 预览生产构建
npm run preview
```

---

## 关键配置

### 代理配置（vite.config.ts）

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

### 环境变量（.env）

```
VITE_API_BASE_URL=/api
VITE_POOL_ID=1
```

---

> 作者：vahoa · 版本：1.0.0-SNAPSHOT   时间：2026年
