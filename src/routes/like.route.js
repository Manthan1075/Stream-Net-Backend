import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getLikes,
  getUserLikes,
  toggleLike,
} from "../controllers/like.controller.js";

const router = express.Router();

router.route("/toggle-like").post(authMiddleware, toggleLike);
router.route("/get-likes/:contentId").get(getLikes);
router.route("/get-user-likes").get(authMiddleware, getUserLikes);

export default router;
