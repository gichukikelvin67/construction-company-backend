import { Router } from "express";
import { register ,login,getMe,refreshAccessToken,logout} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login",login);
router.get("/me",protect,getMe);
router.post("/refresh",refreshAccessToken);
router.post("/logout", logout);

export default router;