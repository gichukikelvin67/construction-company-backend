import { Router } from "express";


import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Get current user's notifications
router.get(
  "/",
  protect,
  getNotifications
);

// Get unread notification count
router.get(
  "/unread-count",
  protect,
  getUnreadNotificationCount
);

// Mark all notifications as read
router.patch(
  "/read-all",
  protect,
  markAllNotificationsAsRead
);

// Mark one notification as read
router.patch(
  "/:id/read",
  protect,
  markNotificationAsRead
);

export default router;