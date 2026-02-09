import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/home/Index.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/user/Login.vue'),
      meta: { title: '登录', guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/user/Register.vue'),
      meta: { title: '注册', guest: true },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/user/Profile.vue'),
      meta: { title: '个人中心', requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/user/Settings.vue'),
      meta: { title: '账号设置', requiresAuth: true },
    },
    {
      path: '/user/:id',
      name: 'UserProfile',
      component: () => import('@/views/user/Profile.vue'),
      meta: { title: '用户主页' },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('@/views/notification/Index.vue'),
      meta: { title: '通知中心', requiresAuth: true },
    },
    {
      path: '/favorites',
      name: 'Favorites',
      component: () => import('@/views/user/Favorites.vue'),
      meta: { title: '我的收藏', requiresAuth: true },
    },
    {
      path: '/posts',
      name: 'PostList',
      component: () => import('@/views/post/List.vue'),
      meta: { title: '帖子列表' },
    },
    {
      path: '/post/:id',
      name: 'PostDetail',
      component: () => import('@/views/post/Detail.vue'),
      meta: { title: '帖子详情' },
    },
    {
      path: '/post/create',
      name: 'PostCreate',
      component: () => import('@/views/post/Create.vue'),
      meta: { title: '发布帖子', requiresAuth: true },
    },
    {
      path: '/post/:id/edit',
      name: 'PostEdit',
      component: () => import('@/views/post/Edit.vue'),
      meta: { title: '编辑帖子', requiresAuth: true },
    },
    {
      path: '/search',
      name: 'Search',
      component: () => import('@/views/search/Index.vue'),
      meta: { title: '搜索结果' },
    },
    {
      path: '/category/:id',
      name: 'Category',
      component: () => import('@/views/category/Index.vue'),
      meta: { title: '版块' },
    },
    {
      path: '/admin',
      name: 'AdminLayout',
      component: () => import('@/views/admin/Layout.vue'),
      meta: { title: '管理后台', requiresAdmin: true },
      children: [
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/Dashboard.vue'),
          meta: { title: '数据概览' },
        },
        {
          path: 'users',
          name: 'AdminUsers',
          component: () => import('@/views/admin/Users.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'reports',
          name: 'AdminReports',
          component: () => import('@/views/admin/Reports.vue'),
          meta: { title: '内容审核' },
        },
        {
          path: 'categories',
          name: 'AdminCategories',
          component: () => import('@/views/admin/Categories.vue'),
          meta: { title: '版块管理' },
        },
        {
          path: 'logs',
          name: 'AdminLogs',
          component: () => import('@/views/admin/Logs.vue'),
          meta: { title: '操作日志' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/home/Index.vue'),
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 初始化认证状态（从 localStorage 恢复）
  userStore.initAuth()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 社区论坛`
  }
  
  // 需要管理员权限的页面 - 允许 admin 和 moderator 角色访问
  if (to.meta.requiresAdmin) {
    // 先检查本地是否有登录信息
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }
    
    // 检查本地存储的用户角色（admin 或 moderator 都可以访问）
    if (userStore.isAdminOrModerator) {
      // 本地验证通过，允许访问（后台会再次验证Token）
      next()
      return
    }
    
    // 本地角色检查不通过，尝试验证Token并刷新用户信息
    const isValid = await userStore.validateAuth()
    if (!isValid) {
      next('/login')
      return
    }
    
    // 再次检查角色权限（使用最新的用户信息）
    if (!userStore.isAdminOrModerator) {
      // 普通用户无权访问管理后台，跳转到首页
      next('/')
      return
    }
  }
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  // 仅限游客访问的页面（如登录页）
  if (to.meta.guest && userStore.isLoggedIn) {
    next('/')
    return
  }
  
  next()
})

export default router