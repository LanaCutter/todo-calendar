import { Router } from "express";
import classRoutes from "./class.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/classes", classRoutes);

export default router;
