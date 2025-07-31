import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  changeThumbnail,
  deletePublishedVideo,
  getAllPublishedVideos,
  getAllVideosByUser,
  getVideoById,
  publishVideo,
  updatePublishedVideo,
} from "../controllers/videos.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route("/publish-video").post(
  authMiddleware,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

router
  .route("/update-published-video/:id")
  .patch(authMiddleware, updatePublishedVideo);
router
  .route("/delete-published-video/:id")
  .delete(authMiddleware, deletePublishedVideo);
router
  .route("/get-published-videos")
  .get(authMiddleware, getAllPublishedVideos);
router.route("/get-video/:videoId").get(authMiddleware, getVideoById);
router.route("/change-thumbnail/:videoId").patch(upload.single("thumbnail"), authMiddleware, changeThumbnail);
router
  .route("/get-user-videos/:userId")
  .post(authMiddleware, getAllVideosByUser);

export default router;
