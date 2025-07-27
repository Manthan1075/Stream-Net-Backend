import { Router } from "express";
import {
  addTowatchHistory,
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
import { upload } from "../middlewares/multer.middleware.js";
import { authMiddlware } from "../middlewares/auth.middleware.js";

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
router.route("/update-profile").post(authMiddlware, updateUserProfile);
router.route("/change-password").post(authMiddlware, changePassword);
router
  .route("/change-avatar")
  .put(authMiddlware, upload.single("avatar"), changeAvatar);
router
  .route("/change-coverimg")
  .put(authMiddlware, upload.single("coverImg"), changeCoverImage);
router.route("/get-profile").get(authMiddlware, getUserProfile);
router.route("/fetch-profile/:userId").get(fetchProfileDetails);
router.route("/add-to-history/:videoId").get(authMiddlware, addTowatchHistory);
router
  .route("/remove-history/:videoId")
  .delete(authMiddlware, removeFromWatchHistory);
router.route("/get-watch-history").get(authMiddlware, fetchWatchHistory);

export default router;