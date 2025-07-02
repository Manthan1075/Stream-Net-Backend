import { Router } from 'express'
import { changeAvatar, changeCoverImage, changePassword, getUserProfile, loginUser, logoutUser, registerUser, updateUserProfile } from '../controllers/users.controller.js';
import { upload } from '../middlewares/multer.middleware.js'
import { authMiddlware } from '../middlewares/auth.middleware.js'

const router = Router();

router.route('/register').post(upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: "coverImg", maxCount: 1 }
]), registerUser);
router.route('/login').post(loginUser)
router.route('/logout').get(logoutUser)
router.route('/update-profile').post(authMiddlware, updateUserProfile);
router.route('/change-password').post(authMiddlware, changePassword);
router.route('/change-avatar').post(
    authMiddlware,
    upload.single('avatar'),
    changeAvatar
);
router.route('/change-coverimg').post(
    authMiddlware,
    upload.single('coverImg'),
    changeCoverImage,
);
router.route('/get-profile').get(authMiddlware, getUserProfile);

export default router