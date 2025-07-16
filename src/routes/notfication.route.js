import express from "express";
import { deleteNotification, getAllNotifications, markNotificationAsRead, sendNotification } from '../controllers/notification.controller.js'
import { authMiddlware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route("/send-notfication").post(sendNotification);
router.route("/mark-read/:notificationId").patch(authMiddlware, markNotificationAsRead);
router.route("/delete-notification/:notificationId").patch(authMiddlware, deleteNotification);
router.get("/get-notifications", authMiddlware, getAllNotifications);

export default router;