import {Router,type ErrorRequestHandler}from "express";
import multer from "multer";
import profilePhotoErrorHandler from "../middleware/profilePhotoErrorHandler.js";
import { createUser
   ,getUsers,
   updateUserStatus,
   updateUserRole,
   getUserById,
   updateUserProfile,
   getMyProfile,
   updateMyProfile,
   uploadMyProfilePhoto,
   removeMyProfilePhoto,
   getMyRegionalPreferences,
   updateMyRegionalPreferences,
   deactivateMyAccount,
  } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createUserSchema ,updateUserRoleSchema,updateUserProfileSchema} from "../validators/userValidators.js";
import uploadProfilePhoto from "../middleware/profilePhotoUpload.js";

const router=Router();
// Personal profile routes — must precede /:id routes.
router.get(
  "/me",
  protect,

  getMyProfile
);
router.get(
  "/me/regional-preferences",
  protect,
  getMyRegionalPreferences
);

router.patch(
  "/me/regional-preferences",
  protect,
  updateMyRegionalPreferences
);

router.patch(
  "/me",
  protect,
  updateMyProfile
);

router.post(
  "/me/photo",
  protect,
  uploadProfilePhoto.single("photo"),
  uploadMyProfilePhoto,
  profilePhotoErrorHandler
);

router.delete(
  "/me/photo",
  protect,
  removeMyProfilePhoto
);

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
router.patch("/me/deactivate", protect, deactivateMyAccount);

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