import { Router } from "express";
import classRoutes from "./class.routes.js";
import assignmentRoutes from "./assignment.routes.js";
import dayTodoRoutes from "./dayTodo.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/classes", classRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/day-todos", dayTodoRoutes);

export default router;
