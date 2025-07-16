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

router.route("/get-comments/:contentId/:contentType").get(getCommentsByContent);
router.use(authMiddlware);

router.route("/post-comment").post(postComment);
router.route("/edit-comment/:commentId").post(editComment);
router.route("/delete-comment/:commentId").delete(deleteComment);
router.route("/get-user-comment").get(getCommentOfUser);

export default router;
