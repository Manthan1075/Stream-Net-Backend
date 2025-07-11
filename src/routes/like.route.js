import express from "express";
import { authMiddlware } from "../middlewares/auth.middleware.js";
import {
  getLikes,
  getUserLikes,
  likeContent,
} from "../controllers/like.controller.js";

const router = express.Router();

router.route("/like-content").post(authMiddlware, likeContent);
router.route("/get-likes").post(getLikes);
router.route("/get-user-likes").post(authMiddlware, getUserLikes);

export default router;
