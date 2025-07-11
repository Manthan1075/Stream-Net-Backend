import asyncHandler from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const likeContent = asyncHandler(async (req, res) => {
  const { contentId, contentType } = req.body;

  if (!contentId || !contentType) {
    return res
      .status(400)
      .json({ message: "Content ID and type are required." });
  }

  const userId = req.user._id;

  const existingLike = await Like.findOne({
    contentId,
    contentType,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json({ message: "Like removed successfully." });
  } else {
    const newLike = await Like.create({
      contentId,
      contentType,
      likedBy: userId,
    });
    return res
      .status(201)
      .json(ApiResponse(201, newLike, "Content liked successfully."));
  }
});

export const getLikes = asyncHandler(async (req, res) => {
  const { contentId, contentType } = req.query;

  if (!contentId || !contentType) {
    return res
      .status(400)
      .json({ message: "Content ID and type are required." });
  }

  const likes = await Like.find({ contentId, contentType }).populate(
    "likedBy",
    "username"
  );

  return res.status(200).json({ likes });
});

export const getUserLikes = asyncHandler(async (req, res) => {
  const { contentType } = req.query;
  if (!contentType) {
    return res.status(400).json({ message: "Content type is required." });
  }
  const userId = req.user._id;

  const likes = await Like.find({ likedBy: userId, contentType }).populate(
    "likedBy",
    "username"
  );
  if (!likes || likes.length === 0) {
    return res.status(404).json({ message: "No likes found for this user." });
  }

  return res
    .status(200)
    .json(ApiResponse(200, likes, "User likes retrieved successfully."));
});
