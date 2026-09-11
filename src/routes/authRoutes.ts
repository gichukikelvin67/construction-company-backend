import { Router } from "express";
import { register ,login,getMe,refreshAccessToken,logout,verifyEmail,
    forgotPassword,resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

import {validate} from "../middleware/validate.js";

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validators/authValidators.js";
import { authRateLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register",
    authRateLimiter,
    validate(registerSchema), 
    register);


router.post("/login",
    authRateLimiter,
     validate (loginSchema), login);

router.get("/me",protect,getMe);
router.post("/refresh",refreshAccessToken);
router.post("/logout", logout);

router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);


router.post("/forgot-password",
    authRateLimiter,
    validate(forgotPasswordSchema),forgotPassword);

router.post("/reset-password",
    authRateLimiter,
    validate(resetPasswordSchema),resetPassword);
    
export default router;