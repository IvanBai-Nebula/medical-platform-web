import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import { initGlobalTheme } from '@/composables/useTheme'
import App from './App.vue'
import router from './router'

// 样式文件
import '@/styles/themes.scss'
import '@/styles/editor-dark.scss'
import '@/styles/editor-force.scss'

// 立即初始化主题，避免闪烁
initGlobalTheme()

const app = createApp(App)

// 创建 Pinia 实例并配置持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

app.mount('#app')
