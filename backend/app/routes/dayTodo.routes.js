import { Router } from "express";
import controller from "../controllers/dayTodo.controller.js";

const router = Router();

router.get("/", controller.findAll);
router.post("/", controller.create);
router.put("/:id/completion", controller.setCompleted);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
