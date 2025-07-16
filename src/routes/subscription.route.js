import { Router } from "express";
import { authMiddlware } from "../middlewares/auth.middleware.js";
import {
  fetchSubscribers,
  fetchSubscription,
  toogleSubscriber,
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/toogle-subsciption/:channelId").get(authMiddlware, toogleSubscriber);
router.route("/fetch-subscriber/:userId").get(fetchSubscribers);
router.route("/fetch-subscription/:userId").get(fetchSubscription);

export default router;
