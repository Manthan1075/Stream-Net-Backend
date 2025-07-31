import { Router } from "express";
import {
  addToWatchHistory,
  changeAvatar,
  changeCoverImage,
  changePassword,
  fetchProfileDetails,
  fetchWatchHistory,
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  removeFromWatchHistory,
  updateUserProfile,
} from "../controllers/users.controller.js";
import { upload } from "../Middlewares/multer.Middleware.js";
import { authMiddleware } from "../Middlewares/auth.Middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImg", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/update-profile").post(authMiddleware, updateUserProfile);
router.route("/change-password").post(authMiddleware, changePassword);
router
  .route("/change-avatar")
  .put(authMiddleware, upload.single("avatar"), changeAvatar);
router
  .route("/change-coverimg")
  .put(authMiddleware, upload.single("coverImg"), changeCoverImage);
router.route("/get-profile").get(authMiddleware, getUserProfile);
router.route("/fetch-profile/:userId").get(fetchProfileDetails);
router.route("/add-to-history/:videoId").get(authMiddleware, addToWatchHistory);
router
  .route("/remove-history/:videoId")
  .delete(authMiddleware, removeFromWatchHistory);
router.route("/get-watch-history").get(authMiddleware, fetchWatchHistory);

export default router;