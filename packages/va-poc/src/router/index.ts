import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ProfileView from "../views/ProfileView.vue";
import AboutView from "../views/AboutView.vue";
import ProcessView from "../views/ProcessView.vue";

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
