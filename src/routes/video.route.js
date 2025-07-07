import express from 'express';
import { authMiddlware } from '../middlewares/auth.middleware.js'
import { deletePublishedVideo, getAllPublishedVideos, getVideoById, publishVideo, updatePublishedVideo } from '../controllers/videos.controller.js';
import { upload } from '../middlewares/multer.middleware.js'

const router = express.Router();

router.route('/publish-video').post(
    authMiddlware,
    upload.fields([
        { name: 'videoFile', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]),
    publishVideo
);

router.route('/update-published-video/:id').patch(authMiddlware, updatePublishedVideo);
router.route('/delete-published-video/:id').delete(authMiddlware, deletePublishedVideo);
router.route('/get-published-videos').post(authMiddlware, getAllPublishedVideos);
router.route('/get-video/:videoId').get(authMiddlware, getVideoById);

export default router;