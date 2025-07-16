import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const postComment = asyncHandler(async (req, res) => {
  const { text, contentType = "Video", contentId } = req.body;

  if (!text || !contentId) {
    throw new ApiError(400, "Comment Text And Content Required");
  }

  const capitalizeContent = contentType.charAt(0).toUpperCase() + contentType.slice(1);

  const comment = await Comment.create({
    text,
    commentedBy: req.user._id,
    contentType: capitalizeContent,
    contentId,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to post comment.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Posted Successfully."));
});

export const editComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const commentId = req.params.commentId;

  if (!commentId) {
    throw new ApiError(400, "Comment ID Is Required.");
  }

  if (!text) {
    throw new ApiError(400, "Comment Text Is Required.");
  }

  const commentOwner = await Comment.findById(commentId);

  if (!commentOwner || commentOwner.commentedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to Edit This Comment.");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { text },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(404, "Comment Not Found.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Updated Successfully."));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const commentId = req.params?.commentId;

  if (!commentId) {
    throw new ApiError(400, "Comment ID Is Required.");
  }

  const commentOwner = await Comment.findById(commentId);

  if (!commentOwner || commentOwner?.commentedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to Delete This Comment.");
  }

  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment Not Found.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment Deleted Successfully."));
});

export const getCommentsByContent = asyncHandler(async (req, res) => {
  const { contentId, contentType = "video" } = req.params;

  if (!contentId) {
    throw new ApiError(400, "Content ID Is Required.");
  }

  const capitalizeContent = contentType.charAt(0).toUpperCase() + contentType.slice(1);

  const comments = await Comment.find({
    contentId,
    contentType: capitalizeContent,
  })
    .populate("commentedBy", "username avatar")
    .limit(20);

  const totalCount = await Comment.countDocuments({
    contentId,
    contentType: capitalizeContent,
  });

  if (!comments || comments.length === 0) {
    throw new ApiError(404, "No Comments Found.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { comments, totalCount }, "Comments Retrieved Successfully."));
});

export const getCommentOfUser = asyncHandler(async (req, res) => {
  const { contentType = "Video" } = req.query;
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User ID Is Required.");
  }

  if (!contentType) {
    throw new ApiError(400, "Content Type Is Required.")
  }

  const capitalizeContent = contentType.charAt(0).toUpperCase() + contentType.slice(1);

  const comments = await Comment.find({ commentedBy: userId, contentType: capitalizeContent })
    .populate("commentedBy", "username avatar");

  const totalCount = await Comment.countDocuments({
    commentedBy: userId,
    contentType: capitalizeContent
  })

  if (!comments || comments.length === 0) {
    throw new ApiError(404, "No Comments Found For This User.");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { comments, totalCount }, "User Comments Retrieved Successfully.")
    );
});
