import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ProfileView from "../views/ProfileView.vue";
import AboutView from "../views/AboutView.vue";
import ProcessView from "../views/ProcessView.vue";
import DebugDashboard from '../views/DebugDashboard.vue'; // Import the new view

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/containers",
    name: "containers",
    component: ProfileView,
  },
  {
    path: "/processes",
    name: "processes",
    component: ProcessView,
  },
  {
    path: "/auth",
    name: "post-lws-authentication",
    component: ProfileView,
  },
  {
    path: "/about",
    name: "about",
    component: AboutView,
  },
  {
    path: "/logout",
    name: "logout",
    beforeEnter: async (to, from, next) => {
      const { logoutFromSolidPod } = await import("../components/providers/LWSAuth");
      await logoutFromSolidPod();
      next("/");
    },
  },
  {
    path: '/debug',
    name: 'DebugDashboard',
    component: DebugDashboard
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
