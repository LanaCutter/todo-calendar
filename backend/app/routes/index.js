import { Router } from "express";
import classRoutes from "./class.routes.js";
import assignmentRoutes from "./assignment.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/classes", classRoutes);
router.use("/assignments", assignmentRoutes);

export default router;
