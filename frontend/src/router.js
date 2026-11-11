import { createRouter, createWebHistory } from "vue-router";
import Classes from "./views/Classes.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: { name: "classes" },
    },
    {
      path: "/classes",
      name: "classes",
      component: Classes,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "classes" },
    },
  ],
});

export default router;
