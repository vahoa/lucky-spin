<template>
  <div class="lottery-page">
    <div class="lottery-container">
      <!-- 标题 -->
      <h1 class="title">幸运抽大奖</h1>
      
      <!-- 通知栏 -->
      <div class="notice-bar">
        <span class="icon">🔊</span>
        <div class="marquee">
        <div class="marquee-content" :style="marqueeStyle">
          <span v-for="(msg, index) in notices" :key="index" class="notice-item">
            {{ msg }}
          </span>
        </div>
        </div>
        <span class="my-prize" @click="goToMyPrizes">我的奖品 ></span>
      </div>

      <!-- 奖品轮播 -->
      <div class="prize-section">
        <button class="arrow left" @click="prevSlide">◀</button>
        <div class="carousel-wrapper">
          <div class="prize-list" :style="listStyle">
            <div 
              v-for="prize in prizes" 
              :key="prize.id"
              :class="['prize-card', { active: currentPrizeId === prize.id }]"
            >
              <div class="prize-image">
                <img :src="prize.imageUrl" :alt="prize.name" />
              </div>
              <span class="prize-name">{{ prize.name }}</span>
            </div>
          </div>
        </div>
        <button class="arrow right" @click="nextSlide">▶</button>
      </div>

      <!-- 抽奖按钮 -->
      <div class="action-section">
        <button 
          class="lottery-btn" 
          :disabled="remaining <= 0 || isDrawing"
          @click="startDraw"
        >
          <span v-if="isDrawing" class="loading"></span>
          <span v-else>立即抽奖</span>
        </button>
        <p class="remaining">剩余 {{ remaining }} 次</p>
      </div>
    </div>

    <!-- 中奖弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="prize-modal">
            <button class="close-btn" @click="closeModal">×</button>
            <h2 class="modal-title">恭喜你，中奖啦！</h2>
            <p class="modal-subtitle">恭喜抽中 {{ winPrize?.name }}</p>
            <div class="prize-icon" :class="{ animate: showAnimation }">
              <img :src="winPrize?.imageUrl" />
              <div class="sparkles"></div>
            </div>
            <button class="confirm-btn" @click="handleConfirm">去查看</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import * as lotteryApi from '@/api/lottery'
import type { Prize } from '@/api/lottery'

const router = useRouter()
const POOL_ID = 1
// TODO: 从登录状态获取真实用户ID
const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9)

// 数据
const prizes = ref<Prize[]>([])
const notices = ref<string[]>([])
const remaining = ref(0)
const totalQuota = ref(0)
const usedQuota = ref(0)
const currentPrizeId = ref<number | null>(null)
const isDrawing = ref(false)
const showModal = ref(false)
const winPrize = ref<Prize | null>(null)
const showAnimation = ref(false)

// 轮播
const currentIndex = ref(0)
const itemWidth = 140

// 动画
let animationTimeline: gsap.core.Timeline | null = null

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (animationTimeline) {
    animationTimeline.kill()
  }
})

async function loadData() {
  try {
    // 使用新的聚合接口
    const pageInfo = await lotteryApi.getDrawPageInfo(USER_ID, POOL_ID)
    prizes.value = pageInfo.prizes
    notices.value = pageInfo.recentWinNotices
    remaining.value = pageInfo.remainingQuota
    totalQuota.value = pageInfo.totalQuota
    usedQuota.value = pageInfo.usedQuota
  } catch (error) {
    console.error('加载数据失败:', error)
    // 降级使用旧接口
    await loadDataLegacy()
  }
}

// 兼容旧接口
async function loadDataLegacy() {
  try {
    const [prizesRes, noticesRes, quotaRes] = await Promise.all([
      lotteryApi.getPrizeList(POOL_ID),
      lotteryApi.getNotices(),
      lotteryApi.getQuota(POOL_ID)
    ])
    prizes.value = prizesRes
    notices.value = noticesRes.map((n: any) => `恭喜用户${n.user},抽中${n.prize}`)
    remaining.value = quotaRes.remaining
  } catch (error) {
    console.error('降级加载也失败:', error)
  }
}

const listStyle = computed(() => ({
  transform: `translateX(${-currentIndex.value * itemWidth}px)`
}))

const marqueeStyle = computed(() => ({
  animationDuration: `${notices.value.length * 3}s`
}))

function prevSlide() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function nextSlide() {
  const maxIndex = Math.max(0, prizes.value.length - 5)
  if (currentIndex.value < maxIndex) {
    currentIndex.value++
  }
}

async function startDraw() {
  if (isDrawing.value || remaining.value <= 0) return
  
  isDrawing.value = true
  
  // 播放抽奖动画
  playDrawAnimation()
  
  try {
    const startTime = performance.now()
    
    // 使用新的抽奖接口
    const result = await lotteryApi.executeDraw({
      userId: USER_ID,
      poolId: POOL_ID
    })
    
    const elapsed = performance.now() - startTime
    
    // 确保动画至少播放3秒
    const minDuration = 3000
    if (elapsed < minDuration) {
      await delay(minDuration - elapsed)
    }
    
    if (result.success) {
      winPrize.value = prizes.value.find(p => p.id === result.prizeId) || null
      if (result.remainingQuota !== undefined) {
        remaining.value = result.remainingQuota
      }
      showModal.value = true
      
      nextTick(() => {
        showAnimation.value = true
      })
    } else {
      alert(result.message || '抽奖失败')
    }
  } catch (error) {
    console.error('抽奖失败:', error)
    alert('网络异常，请稍后重试')
  } finally {
    isDrawing.value = false
    if (animationTimeline) {
      animationTimeline.kill()
      animationTimeline = null
    }
  }
}

function playDrawAnimation() {
  const prizeIds = prizes.value.map(p => p.id)
  let currentSpin = 0
  
  animationTimeline = gsap.timeline({
    onUpdate: () => {
      const index = currentSpin % prizeIds.length
      currentPrizeId.value = prizeIds[index]
      currentSpin++
    }
  })
  
  // 加速阶段
  for (let i = 0; i < 10; i++) {
    animationTimeline.to({}, { duration: 0.05 + i * 0.01 })
  }
  
  // 匀速阶段
  for (let i = 0; i < 15; i++) {
    animationTimeline.to({}, { duration: 0.1 })
  }
  
  // 减速阶段
  for (let i = 0; i < 5; i++) {
    animationTimeline.to({}, { duration: 0.15 + i * 0.05 })
  }
}

function closeModal() {
  showModal.value = false
  showAnimation.value = false
}

function handleConfirm() {
  closeModal()
  router.push('/my-prizes')
}

function goToMyPrizes() {
  router.push('/my-prizes')
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
</script>

<style scoped lang="scss">
.lottery-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lottery-container {
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
}

.notice-bar {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 12px 20px;
  border-radius: 30px;
  margin-bottom: 32px;

  .icon {
    font-size: 18px;
    margin-right: 12px;
  }

  .marquee {
    flex: 1;
    overflow: hidden;
    height: 24px;
    position: relative;
  }

  .marquee-content {
    display: flex;
    position: absolute;
    white-space: nowrap;
    animation: scroll linear infinite;
  }

  .notice-item {
    margin-right: 40px;
    color: #666;
    font-size: 14px;
  }

  .my-prize {
    color: #ff6b6b;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

@keyframes scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.prize-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.carousel-wrapper {
  flex: 1;
  overflow: hidden;
}

.prize-list {
  display: flex;
  gap: 16px;
  transition: transform 0.3s ease;
}

.prize-card {
  flex-shrink: 0;
  width: 120px;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  border: 2px solid #e9ecef;
  text-align: center;
  transition: all 0.3s ease;

  &.active {
    border-color: #ff6b6b;
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
  }

  .prize-image {
    width: 80px;
    height: 80px;
    margin: 0 auto 12px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .prize-name {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
}

.arrow {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: #e9ecef;
  }
}

.action-section {
  text-align: center;
}

.lottery-btn {
  width: 240px;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  color: white;
  font-size: 20px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
  }

  .loading {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.remaining {
  color: #666;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.prize-modal {
  background: white;
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  position: relative;
  min-width: 320px;
  animation: modalPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes modalPop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;

  &:hover {
    background: #e9ecef;
  }
}

.modal-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.modal-subtitle {
  color: #666;
  margin-bottom: 24px;
}

.prize-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &.animate {
    animation: prizeBounce 0.6s ease infinite alternate;
  }
}

@keyframes prizeBounce {
  0% { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1.1) rotate(5deg); }
}

.sparkles {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, transparent 70%);
  animation: sparkle 1s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.confirm-btn {
  width: 200px;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  color: white;
  font-size: 16px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>