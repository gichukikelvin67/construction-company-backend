import {Router}from "express";
import { createUser ,getUsers,updateUserStatus,updateUserRole,getUserById,updateUserProfile} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createUserSchema ,updateUserRoleSchema,updateUserProfileSchema} from "../validators/userValidators.js";


const router=Router();

router.post(
    "/",
    protect,
    allowRoles("admin"),
    validate(createUserSchema),
    createUser
);

router.get(
    "/",
    protect,
    allowRoles("admin"),
    getUsers
);

router.get(
  "/:id",
  protect,
  allowRoles("admin"),
  getUserById
);

router.patch(
    "/:id/status",
    protect,
    allowRoles("admin"),
    updateUserStatus
);

router.patch(
  "/:id",
  protect,
  allowRoles("admin"),
  validate(updateUserProfileSchema),
  updateUserProfile
);

router.patch(
  "/:id/role",
  protect,
  allowRoles("admin"),
  validate(updateUserRoleSchema),
  updateUserRole
);
export default router;