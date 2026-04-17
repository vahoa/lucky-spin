import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/LotteryView.vue')
  },
  {
    path: '/my-prizes',
    name: 'MyPrizes',
    component: () => import('@/views/MyPrizesView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router