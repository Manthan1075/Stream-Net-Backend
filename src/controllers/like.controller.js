import asyncHandler from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

export const toogleLike = asyncHandler(async (req, res) => {
  const { contentId, contentType } = req.body;

  if (!contentId || !contentType) {
    throw new ApiError(400, "Content ID and type are required.");
  }

  const userId = req.user._id;
  const capitalizeContent = contentType.charAt(0).toUpperCase() + contentType.slice(1);

  let content = null;

  if (capitalizeContent === "Video") {
    content = await Video.findById(contentId);
  } else
    if (capitalizeContent === "Post") {
      content = await Post.findById(contentId);
    } else
      if (capitalizeContent === "Comment") {
        content = await Comment.findById(contentId);
      } else {
        throw new ApiError(400, "Invalid content type.");
      }

  if (!content) {
    throw new ApiError(404, "Content not found.");
  }

  const existingLike = await Like.findOne({
    contentId,
    capitalizeContent,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json({ message: "Like removed successfully." });
  }
  const newLike = await Like.create({
    contentId,
    contentType,
    likedBy: userId,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, newLike, "Content liked successfully."));

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
