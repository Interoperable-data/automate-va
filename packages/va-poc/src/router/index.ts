import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import AboutView from '../views/AboutView.vue'
import ProcessView from '../views/ProcessView.vue'
import DebugDashboard from '../views/DebugDashboard.vue'
import { sessionStore } from '@va-automate/lws-manager'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/containers',
    name: 'containers',
    component: ProfileView,
  },
  {
    path: '/processes',
    name: 'processes',
    component: ProcessView,
    beforeEnter: (to, from, next) => {
      if (!sessionStore.loggedInWebId) {
        next('/')
      } else {
        next()
      }
    },
  },
  {
    path: '/auth',
    name: 'post-lws-authentication',
    component: ProfileView,
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
  {
    path: '/logout',
    name: 'logout',
    beforeEnter: async (to, from, next) => {
      const { logoutFromSolidPod } = await import('@va-automate/lws-manager')
      await logoutFromSolidPod()
      next('/')
    },
  },
  {
    path: '/debug',
    name: 'DebugDashboard',
    component: DebugDashboard,
    beforeEnter: (to, from, next) => {
      if (!sessionStore.loggedInWebId) {
        next('/')
      } else {
        next()
      }
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
