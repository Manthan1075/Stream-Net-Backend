import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  fetchSubscribers,
  fetchSubscription,
  toogleSubscriber,
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/toogle-subsciption/:channelId").get(authMiddleware, toogleSubscriber);
router.route("/fetch-subscriber/:userId").get(fetchSubscribers);
router.route("/fetch-subscription/:userId").get(fetchSubscription);

export default router;
