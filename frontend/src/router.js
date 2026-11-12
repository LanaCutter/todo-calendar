import { createRouter, createWebHistory } from "vue-router";
import Assignments from "./views/Assignments.vue";
import Calendar from "./views/Calendar.vue";
import Classes from "./views/Classes.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "calendar",
      component: Calendar,
    },
    {
      path: "/assignments",
      name: "assignments",
      component: Assignments,
    },
    {
      path: "/classes",
      name: "classes",
      component: Classes,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "calendar" },
    },
  ],
});

export default router;
