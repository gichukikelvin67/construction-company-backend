import {Router} from "express";

import{
    createProjectAssignment,
     getProjectAssignments,
     updateProjectAssignment,
}from "../controllers/projectAssignmentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {validate} from "../middleware/validate.js";


import{
    createProjectAssignmentSchema,
    updateProjectAssignmentSchema,
}from "../validators/projectAssignmentValidators.js";

const router=Router();

router.get(
  "/project/:projectId",
  protect,
  getProjectAssignments
);

router.post("/",
    protect,
    allowRoles("admin","project_manager"),
    createProjectAssignment
);

router.patch(
  "/:id",
  protect,
  allowRoles("admin", "project_manager"),
  validate(updateProjectAssignmentSchema),
  updateProjectAssignment
);

export default router;
