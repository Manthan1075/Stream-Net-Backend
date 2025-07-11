import { Router } from "express";
import { authMiddlware } from "../middlewares/auth.middleware.js";
import {
  addSubscriber,
  fetchSubscribers,
  fetchSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/add-subsciption/:channelId").get(authMiddlware, addSubscriber);
router.route("/fetch-subscriber/:userId").get(fetchSubscribers);
router.route("/fetch-subscription/:userId").get(fetchSubscription);

export default router;
