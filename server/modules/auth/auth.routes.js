import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { tenantMiddleware } from "../../middlewares/tenantMiddleware.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { loginLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

router.post("/login", loginLimiter, tenantMiddleware, AuthController.login);
router.post("/telegram", loginLimiter, AuthController.telegramLogin);
router.post("/logout", tenantMiddleware, AuthController.logout);
router.post("/refresh", loginLimiter, tenantMiddleware, AuthController.refresh);
router.get("/me", tenantMiddleware, authMiddleware, AuthController.me);

export default router;
