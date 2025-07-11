import express from "express";
import { authMiddlware } from "../middlewares/auth.middleware.js";
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

router.route("/create-post").post(authMiddlware, upload.single("image"), createPost);
router.route("/update-post/:postId").patch(authMiddlware, updatePost);
router.route("/delete-post").delete(authMiddlware, deletePost);
router.route("/get-post/:postId").get(getPostById);
router.route("/get-posts").get(getAllPosts);
router.route("/get-user-post").get(authMiddlware, getUserPosts);

export default router;
