import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { appEnv } from './config/env'

import './styles/main.scss'

document.title = appEnv.title

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')