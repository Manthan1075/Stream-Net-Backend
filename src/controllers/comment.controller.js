import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Comment } from '../models/comment.model.js'
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

export const postComment = asyncHandler(async (req, res) => {
    const { text, content = "video", contentId } = req.body;

    if (!text || !contentId) {
        throw new ApiError(400, "Comment Text And Content Required")
    }

    const capitalizeContent = content.charAt(0).toUpperCase() + content.slice(1);

    const comment = await Comment.create({
        text,
        commentedBy: req.user._id,
        content: capitalizeContent,
        contentId
    })

    if (!comment) {
        throw new ApiError(500, "Failed to post comment.")
    }

    res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment Posted Successfully."))
})

export const editComment = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const commentId = req.params.id;

    if (!commentId) {
        throw new ApiError(400, "Comment ID Is Required.")
    }

    if (!text) {
        throw new ApiError(400, "Comment Text Is Required.")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        { text },
        { new: true }
    );

    if (!comment) {
        throw new ApiError(404, "Comment Not Found.")
    }

    res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment Updated Successfully."))
});

export const deleteComment = asyncHandler(async (req, res) => {
    const commentId = req.params.id;

    if (!commentId) {
        throw new ApiError(400, "Comment ID Is Required.")
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment Not Found.")
    }

    res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment Deleted Successfully."))
});

export const getCommentsByContent = asyncHandler(async (req, res) => {
    const { contentId, content = "video" } = req.params;

    if (!contentId) {
        throw new ApiError(400, "Content ID Is Required.")
    }

    const capitalizeContent = content.charAt(0).toUpperCase() + content.slice(1);

    const comments = await Comment.find({ contentId, content: capitalizeContent })
        .populate("commentedBy", "name profilePicture");

    if (!comments || comments.length === 0) {
        throw new ApiError(404, "No Comments Found.")
    }

    res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments Retrieved Successfully."))
});

export const getCommentOfUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID Is Required.")
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                commentedBy: mongoose.Schema.Types.ObjectId(userId)
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "commentedBy",
                foreignField: "_id",
                as: "userDetails"
            }
        },
    ])

    if (!comments || comments.length === 0) {
        throw new ApiError(404, "No Comments Found For This User.")
    }

    res
        .status(200)
        .json(new ApiResponse(200, comments, "User Comments Retrieved Successfully."))

});