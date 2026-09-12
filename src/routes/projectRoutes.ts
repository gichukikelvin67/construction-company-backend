import { Router } from "express";

import { createProject , getProjects,getProjectById,updateProject} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";

import { validate } from "../middleware/validate.js";

import { allowRoles } from "../middleware/roleMiddleware.js";

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
    allowRoles("admin","project_manager"),
    validate(updateProjectSchema),
    updateProject
);


router.post(
  "/",
  protect,
  allowRoles("admin","project_manager"),
  validate(createProjectSchema),
  createProject
);

export default router;