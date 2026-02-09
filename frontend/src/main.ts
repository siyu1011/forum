import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.scss'
import { useUserStore } from '@/stores/user'
import { setupDirectives } from '@/directives'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)

// 初始化用户认证状态（必须在 router 之前）
const userStore = useUserStore(pinia)
userStore.initAuth()

app.use(ElementPlus)
app.use(router)

// 注册自定义指令
setupDirectives(app)

app.mount('#app')
