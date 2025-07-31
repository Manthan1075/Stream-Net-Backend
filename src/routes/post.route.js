import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route("/create-post").post(authMiddleware, upload.single("image"), createPost);
router.route("/update-post/:postId").patch(authMiddleware, updatePost);
router.route("/delete-post/:postId").delete(authMiddleware, deletePost);
router.route("/get-post/:postId").get(getPostById);
router.route("/get-random-posts").get(getAllPosts);
router.route("/get-user-post/:userId").get(authMiddleware, getUserPosts);

export default router;
