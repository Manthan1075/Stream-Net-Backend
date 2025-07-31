import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getLikes,
  getUserLikes,
  toogleLike,
} from "../controllers/like.controller.js";

const router = express.Router();

router.route("/toogle-like").post(authMiddleware, toogleLike);
router.route("/get-likes/:contentId").get(getLikes);
router.route("/get-user-likes").get(authMiddleware, getUserLikes);

export default router;
