<template>
  <div class="my-prizes">
    <header class="header">
      <button type="button" class="back" @click="goBack">返回</button>
      <h1>我的奖品</h1>
    </header>
    <p class="hint">奖品列表需对接后端接口后在此展示。</p>
    <p class="env">当前环境：<strong>{{ appEnv.mode }}</strong></p>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { appEnv } from '@/config/env'

const router = useRouter()

function goBack() {
  router.push('/')
}
</script>

<style scoped lang="scss">
.my-prizes {
  min-height: 100vh;
  padding: 24px;
  max-width: 640px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }
}

.back {
  border: none;
  background: #f1f3f5;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background: #e9ecef;
  }
}

.hint {
  color: #666;
  line-height: 1.6;
}

.env {
  margin-top: 32px;
  font-size: 0.9rem;
  color: #868e96;
}
</style>
