import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  fetchSubscribers,
  fetchSubscription,
  toggleSubscriber,
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/toggle-subscription/:channelId").get(authMiddleware, toggleSubscriber);
router.route("/fetch-subscriber/:userId").get(fetchSubscribers);
router.route("/fetch-subscription/:userId").get(fetchSubscription);

export default router;
