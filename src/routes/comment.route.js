import express from "express";
import { authMiddlware } from "../middlewares/auth.middleware.js";
import {
  deleteComment,
  editComment,
  getCommentOfUser,
  getCommentsByContent,
  postComment,
} from "../controllers/comment.controller.js";

const router = express.Router();

router.use(authMiddlware);

router.route("/post-comment").post(postComment);
router.route("/edit-comment").post(editComment);
router.route("/delete-comment").delete(deleteComment);
router.route("/get-comment/:contentId/:content").get(getCommentsByContent);
router.route("/get-user-comment").get(getCommentOfUser);

export default router;
