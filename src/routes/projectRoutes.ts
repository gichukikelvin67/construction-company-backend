import { Router } from "express";

import { createProject , getProjects,getProjectById,updateProject} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";

import { validate } from "../middleware/validate.js";

import { createProjectSchema, updateProjectSchema } from "../validators/projectValidators.js";

const router = Router();

router.get("/",
    protect,
    getProjects
);


router.get(
  "/:id",
  protect,
  getProjectById
);

router.patch(
    "/:id",
    protect,
    validate(updateProjectSchema),
    updateProject
);


router.post(
  "/",
  protect,
  validate(createProjectSchema),
  createProject
);

export default router;