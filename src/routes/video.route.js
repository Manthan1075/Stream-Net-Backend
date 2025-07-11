import express from "express";
import { authMiddlware } from "../middlewares/auth.middleware.js";
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
  authMiddlware,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

router
  .route("/update-published-video/:id")
  .patch(authMiddlware, updatePublishedVideo);
router
  .route("/delete-published-video/:id")
  .delete(authMiddlware, deletePublishedVideo);
router
  .route("/get-published-videos")
  .get(authMiddlware, getAllPublishedVideos);
router.route("/get-video/:videoId").get(authMiddlware, getVideoById);
router.route("/change-thumbnail/:videoId").patch(upload.single("thumbnail"), authMiddlware, changeThumbnail);
router
  .route("/get-user-videos/:userId")
  .post(authMiddlware, getAllVideosByUser);

export default router;
