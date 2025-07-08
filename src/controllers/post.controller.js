import asyncHandler from "../utils/asyncHandler.js";
import { Post } from "../models/post.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const createPost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id;
  const image = req.file?.path;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  let imageUrl = null;
  if (image) {
    imageUrl = await uploadToCloudinary(image);
  }

  if (imageUrl) {
    throw new ApiError(400, "Failed to upload image");
  }

  const post = await Post.create({
    content,
    image: imageUrl,
    postedBy: userId,
  });

  if (!post) {
    throw new ApiError(400, "Failed to create post");
  }

  res.status(201).json(new ApiResponse(201, "Post created successfully", post));
});

export const updatePost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;
  const userId = req.user._id;
  const image = req.file?.path;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this post");
  }

  const imageUrl = image ? await uploadToCloudinary(image) : post.image;

  if (!imageUrl) {
    throw new ApiError(400, "Failed to upload image");
  }
  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    {
      content,
      image: imageUrl,
    },
    { new: true }
  );

  if (!updatedPost) {
    throw new ApiError(500, "Failed to update post");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Post updated successfully", updatedPost));
});

export const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  await Post.findByIdAndDelete(postId);

  res.status(200).json(new ApiResponse(200, "Post deleted successfully"));
});

export const getPostById = asyncHandler(async (req, res) => {
  const postId = req.params.id;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const post = await Post.findById(postId).populate(
    "postedBy",
    "username avatar"
  );

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Post retrieved successfully", post));
});

export const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.aggregate([
    { $sample: { size: 20 } },
    {
      $lookup: {
        from: "users",
        localField: "postedBy",
        foreignField: "_id",
        as: "postedBy",
      },
    },
    {
      $unwind: "$postedBy",
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        "postedBy.username": 1,
        "postedBy.avatar": 1,
      },
    },
  ]);

  if (!posts || posts.length === 0) {
    throw new ApiError(404, "No posts found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Posts retrieved successfully", posts));
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const posts = await Post.find({ postedBy: userId })
    .populate("postedBy", "username avatar")
    .sort({ createdAt: -1 });

  if (!posts || posts.length === 0) {
    throw new ApiError(404, "No posts found for this user");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "User posts retrieved successfully", posts));
});
