import { Router } from "express";
import { register ,login,getMe,refreshAccessToken,logout,verifyEmail,
    forgotPassword,resetPassword,changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

import {validate} from "../middleware/validate.js";

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from "../validators/authValidators.js";
import { loginRateLimiter , registerRateLimiter, passwordResetRateLimiter} from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register",
    registerRateLimiter,
    validate(registerSchema), 
    register);


router.post(
    "/login",
    loginRateLimiter,
     validate (loginSchema), 
     login
    );

router.get("/me",protect,getMe);
router.post("/refresh",refreshAccessToken);
router.post("/logout", logout);

router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);


router.post("/forgot-password",
    passwordResetRateLimiter,
    validate(forgotPasswordSchema),forgotPassword);

router.post("/reset-password",
    passwordResetRateLimiter,
    validate(resetPasswordSchema),resetPassword);

    router.patch(
        "/change-password",
        protect,
        validate(changePasswordSchema),
        changePassword
    );
    
export default router;