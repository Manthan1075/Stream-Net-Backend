import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {
  deleteFromCloudinary,
  getThumbnail,
  uploadToCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { extractPublicId } from "cloudinary-build-url";
import mongoose from "mongoose";
import { deleteLocalFile } from '../middlewares/multer.middleware.js'
import { getVideoDurationInSeconds } from 'get-video-duration'

export const publishVideo = asyncHandler(async (req, res) => {
  const { description, title, type } = req.body;
  const localVideo = req.files?.videoFile?.[0]?.path;
  let localThumbnail = null;
  if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
    localThumbnail = req.files.thumbnail[0].path;
  }

  if (!localVideo) {
    throw new ApiError(400, "Video File Is Required.");
  }

  if (!title) {
    throw new ApiError(400, "Title Is Required.");
  }

  if (type === "short") {
    const duration = await getVideoDurationInSeconds(localVideo);
    if (duration > 120) {
      throw new ApiError(400, "Short video duration must be within 120 seconds");
    }
  }

  const videoUploadResponse = await uploadToCloudinary(localVideo);

  if (!videoUploadResponse) {
    await deleteLocalFile(localVideo);
    throw new ApiError(500, "Failed to upload video to cloud.");
  }

  let thumbnailUrl = null;
  if (localThumbnail) {
    const thumbnail = await uploadToCloudinary(localThumbnail);
    await deleteLocalFile(localVideo);
    thumbnailUrl = thumbnail?.secure_url;
    if (!thumbnailUrl) {
      throw new ApiError(500, "Failed to upload thumbnail to cloud.");
    }
  } else {
    const thumbnail = await getThumbnail(videoUploadResponse.public_id);
    await deleteLocalFile(localVideo);
    if (!thumbnail) {
      throw new ApiError(500, "Failed to generate thumbnail for video.");
    }
    thumbnailUrl = thumbnail;
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoUploadResponse.secure_url,
    thumbnail: thumbnailUrl || "",
    duration: videoUploadResponse?.duration,
    creator: req.user._id,
    isPublished: true,
  });

  if (!video) {
    throw new ApiError(500, "Failed to Publish video.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video Published Successfully."));
});

export const updatePublishedVideo = asyncHandler(async (req, res) => {
  const { description, title } = req.body;
  const videoId = req.params.id;

  if (!videoId) {
    throw new ApiError(400, "Video ID Is Required.");
  }

  if (!description && !title) {
    throw new ApiError(400, "Description or Title Is Required.");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found.");
  }

  if (video?.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video.");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      description,
      title,
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video Not Found.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video Updated Successfully."));
});

export const deletePublishedVideo = asyncHandler(async (req, res) => {
  const videoId = req.params.id;
  if (!videoId) {
    throw new ApiError(400, "Video ID Is Required.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found.");
  }

  if (video?.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video.");
  }

  const deleteVideoResponse = await Video.findByIdAndDelete(videoId);
  if (!deleteVideoResponse) {
    throw new ApiError(404, "Video Not Found.");
  }
  res
    .status(200)
    .json(new ApiResponse(200, null, "Video Deleted Successfully."));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID format.");
  }

  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  const video = await Video.aggregate([
    {
      $match: {
        _id: videoObjectId,
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creator",
      },
    },
    { $unwind: "$creator" },
    {
      $lookup: {
        from: "subscriptions",
        let: { creatorId: "$creator._id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$channel", "$$creatorId"] },
            },
          },
          {
            $group: {
              _id: null,
              totalSubscribers: { $sum: 1 },
            },
          },
        ],
        as: "subscriberData",
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $ifNull: [{ $arrayElemAt: ["$subscriberData.totalSubscribers", 0] }, 0],
        },
      },
    },
    {
      $project: {
        title: 1,
        videoFile: 1,
        thumbnail: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        updatedAt: 1,
        totalSubscribers: 1,
        "creator._id": 1,
        "creator.username": 1,
        "creator.avatar": 1,
      },
    },
    {
      $lookup: {
        from: "likes",
        let: { videoId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$contentId", "$$videoId"] },
                  { $eq: ["$contentType", "Video"] },
                ],
              },
            },
          },
        ],
        as: "likes",
      },
    },
  ]);


  if (!video || video.length === 0) {
    throw new ApiError(404, "Video not found.");
  }

  await Video.updateOne(
    { _id: videoObjectId },
    { $inc: { views: 1 } }
  );


  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully."));
});

export const getAllPublishedVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortType = "latest", query = "", type = "video" } = req.query;
  const currentPage = Math.max(Number(page), 1);
  const pageSize = Math.max(Number(limit), 1);

  let sortQuery = {};
  switch (sortType) {
    case "most-viewed":
      sortQuery = { views: 1 };
      break;
    case "latest":
      sortQuery = { createdAt: -1 };
      break;
    case "oldest":
      sortQuery = { createdAt: 1 };
      break;
    case "a-z":
      sortQuery = { title: 1 };
      break;
    case "z-a":
      sortQuery = { title: -1 };
      break;
    default:
      sortQuery = {};
      break;
  }

  const filter = { isPublished: true };

  const videos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
        type: type,
        ...(query
          ? {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } }
            ]
          }
          : {}),
      },
    },
    {
      $sample: { size: pageSize * 5 },
    },
    {
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creator",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        creator: { $arrayElemAt: ["$creator", 0] }
      }
    },
    {
      $sort: sortQuery,
    },
    {
      $skip: (currentPage - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ]);

  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No Videos Found.");
  }

  const totalVideos = await Video.countDocuments(filter);
  const totalPages = Math.ceil(totalVideos / pageSize);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        totalVideos,
        totalPages,
        currentPage,
      },
      "Videos Fetched Successfully."
    )
  );
});

export const changeThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const localThumbnail = req.file;

  if (!videoId) {
    throw new ApiError(400, "Video ID Is Required.");
  }


  if (!localThumbnail) {
    throw new ApiError(400, "Thumbnail File Is Required.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found.");
  }

  if (video?.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video.");
  }

  const thumbnailUploadResponse = await uploadToCloudinary(localThumbnail?.path);
  if (!thumbnailUploadResponse) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  const thumbnail = await Video.findById(videoId).select("thumbnail");

  const updateResponse = await Video.findByIdAndUpdate(
    videoId,
    {
      thumbnail: thumbnailUploadResponse.secure_url,
    },
    { new: true }
  );

  if (!updateResponse) {
    await deleteLocalFile(localThumbnail.path)
    throw new ApiError(404, "Video Not Found.");
  }

  if (thumbnail) {
    await deleteFromCloudinary(extractPublicId(thumbnail));
  }

  res
    .status(200)
    .json(new ApiResponse(200, updateResponse, "Thumbnail Updated Successfully."));
});

export const getAllVideosByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID Is Required.");
  }
  const isOwner = req.user._id.toString() === userId.toString();

  const filter = isOwner ? {} : { isPublished: true };

  const videos = await Video.find({
    creator: userId,
    ...filter
  }).sort({
    isPublished: true,
    createdAt: -1,
  });


  if (!videos && videos.length === 0) {
    throw new ApiError(404, "No Videos Found For This User.");
  }


  res
    .status(200)
    .json(new ApiResponse(200, { videos, isOwner }, "Videos Fetched Successfully."));
});
