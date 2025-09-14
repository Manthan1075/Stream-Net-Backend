import asyncHandler from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

export const toggleLike = asyncHandler(async (req, res) => {
  const { contentId, contentType } = req.body;

  if (!contentId || !contentType) {
    throw new ApiError(400, "Content ID and type are required.");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(403, "You are not authorized to perform this action.");
  }

  const capitalizedType =
    contentType.charAt(0).toUpperCase() + contentType.slice(1);

  // ✅ validate content exists
  const modelMap = { Video, Post, Comment };
  const Model = modelMap[capitalizedType];
  if (!Model) throw new ApiError(400, "Invalid content type.");

  const content = await Model.findById(contentId);
  if (!content) throw new ApiError(404, "Content not found.");

  // ✅ check like
  const existingLike = await Like.findOne({
    contentId,
    contentType: capitalizedType,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json(
      new ApiResponse(200, { isLiked: false }, "Like removed successfully.")
    );
  }

  const newLike = await Like.create({
    contentId,
    contentType: capitalizedType,
    likedBy: userId,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      { isLiked: true, like: newLike },
      "Content liked successfully."
    )
  );
});

export const getLikes = asyncHandler(async (req, res) => {
  const { contentId } = req.params;

  if (!contentId) {
    throw new ApiError(400, "Content ID is required.");
  }

  const likes = await Like.find({ contentId }).populate(
    "likedBy",
    "username"
  )
  const count = likes?.length;

  if (likes === 0 && likes?.length === 0) {
    return res.status(200)
      .json(new ApiResponse(200, 0, "No likes found for this content."));
  }

  return res.status(200).json(new ApiResponse(200, { likes, count }, "Like Fetched Successfully"));
});

export const getUserLikes = asyncHandler(async (req, res) => {
  const { contentType } = req.query;
  if (!contentType) {
    return res.status(400).json({ message: "Content type is required." });
  }
  const userId = req.user._id;
  const capitalizeContent = contentType.charAt(0).toUpperCase() + contentType.slice(1);

  const likes = await Like.find({ likedBy: userId, contentType: capitalizeContent }).populate(
    "likedBy",
    "username"
  );
  if (!likes || likes.length === 0) {
    return res.status(404).json({ message: "No likes found for this user." });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likes, "User likes retrieved successfully."));
});
