import express from "express";
import { authMiddlware } from "../middlewares/auth.middleware.js";
import {
  getLikes,
  getUserLikes,
  toogleLike,
} from "../controllers/like.controller.js";

const router = express.Router();

router.route("/toogle-like").post(authMiddlware, toogleLike);
router.route("/get-likes/:contentId").get(getLikes);
router.route("/get-user-likes").get(authMiddlware, getUserLikes);

export default router;
