import { Notification } from '../models/notification.model.js'
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js'

export const sendNotification = asyncHandler(async (req, res) => {
    const { reciever, content } = req.body;

    if (!reciever || !content) {
        throw new ApiError(400, 'reciever and content Is Reuired');
    }

    const user = await User.findById(reciever);

    if (!user) {
        throw new ApiError(404, 'User Not Found');
    }

    const notification = await Notification.create({
        reciever,
        content
    });

    if (!notification) {
        throw new ApiError(500, 'Failed to send notification');
    }

    return res.status(201).json(new ApiResponse(201, notification, 'Notification sent successfully'));

})

export const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params.notificationId;

    if (!notificationId) {
        throw new ApiError(400, 'Notification Id Is Required');
    }

    const notification = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });

    if (!notification) {
        throw new ApiError(404, 'Notification Not Found');
    }

    return res.status(200).json(new ApiResponse(200, notification, 'Notification marked as read successfully'));
})

export const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params.notificationId;

    if (!notificationId) {
        throw new ApiError(400, 'Notification Id Is Required');
    }

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
        throw new ApiError(404, "Notification Not Found!")
    }

    return res.status(200).json(new ApiResponse(200, notification, 'Notification deleted successfully'));

})

export const getAllNotifications = asyncHandler(async (req, res) => {

    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, 'Unauthorized Accsess');
    }

    const notifications = await Notification.find({ reciever: userId }).sort({ createdAt: -1 });

    if (!notifications || notifications.length === 0) {
        throw new ApiResponse(200, [], 'No Notifications Found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, 'All notifications fetched successfully'));
})