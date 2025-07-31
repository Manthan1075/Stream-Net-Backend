import express from "express";
import { deleteNotification, getAllNotifications, markNotificationAsRead, sendNotification } from '../controllers/notification.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route("/send-notification").post(sendNotification);
router.route("/mark-read/:notificationId").patch(authMiddleware, markNotificationAsRead);
router.route("/delete-notification/:notificationId").patch(authMiddleware, deleteNotification);
router.get("/get-notifications", authMiddleware, getAllNotifications);

export default router;