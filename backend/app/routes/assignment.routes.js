import { Router } from "express";
import controller from "../controllers/assignment.controller.js";

const router = Router();

router.get("/", controller.findAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
