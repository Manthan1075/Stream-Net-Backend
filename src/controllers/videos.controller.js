import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from '../utils/apiError.js'
import { deleteFromCloudinary, uploadToCloudinary } from '../utils/cloudinary.js'
import { Video } from "../models/video.model.js";
import { ApiResponse } from '../utils/apiResponse.js'
import { extractPublicId } from 'cloudinary-build-url'
import mongoose from "mongoose";

export const publishVideo = asyncHandler(async (req, res) => {
    const { description, title } = req.body;
    const localVideo = req.files?.videoFile[0]?.path;
    const localThumbnail = req.files?.thumbnail[0]?.path;

    if (!localVideo) {
        throw new ApiError(400, "Video File Is Required.");
    }

    if (!title) {
        throw new ApiError(400, "Title Is Required.");
    }

    const videoUploadResponse = await uploadToCloudinary(localVideo)

    if (!videoUploadResponse) {
        throw new ApiError(500, "Failed to upload video to cloud.")
    }

    const thumbnailUploadResponse = await uploadToCloudinary(localThumbnail)
    if (!thumbnailUploadResponse) {
        throw new ApiError(500, "Failed to upload thumbnail to cloud.")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUploadResponse.secure_url,
        thumbnail: thumbnailUploadResponse.secure_url,
        duration: videoUploadResponse?.duration,
        creator: req.user._id,
        isPublished: true
    })

    if (!video) {
        throw new ApiError(500, "Failed to Publish video.")
    }

    res
        .status(200)
        .json(new ApiResponse(200, video, "Video Published Successfully."))

})

export const updatePublishedVideo = asyncHandler(async (req, res) => {
    const { description, title } = req.body;
    const videoId = req.params.id;

    if (!videoId) {
        throw new ApiError(400, "Video ID Is Required.");
    }

    if (!description && !title) {
        throw new ApiError(400, "Description or Title Is Required.");
    }
    
    if (videoId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video.");
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        description,
        title
    }, { new: true });

    if (!video) {
        throw new ApiError(404, "Video Not Found.");
    }


    res
        .status(200)
        .json(new ApiResponse(200, video, "Video Updated Successfully."))
})

export const deletePublishedVideo = asyncHandler(async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        throw new ApiError(400, "Video ID Is Required.");
    }

    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
        throw new ApiError(404, "Video Not Found.");
    }
    res
        .status(200)
        .json(new ApiResponse(200, null, "Video Deleted Successfully."))
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
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator"
            }
        },
        {
            $unwind: "$creator"
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
                "creator._id": 1,
                "creator.username": 1,
                "creator.avatar": 1
            }
        },
        {
            $lookup: {
                from: "comments",
                let: { videoId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$contentId", "$$videoId"] }
                        }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "user",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    {
                        $unwind: "$user"
                    },
                    {
                        $project: {
                            text: 1,
                            createdAt: 1,
                            "user._id": 1,
                            "user.username": 1,
                            "user.avatar": 1
                        }
                    }
                ],
                as: "comments"
            }
        }
    ]);

    if (!video || video.length === 0) {
        throw new ApiError(404, "Video not found.");
    }

    res.status(200).json(new ApiResponse(200, video[0], "Video fetched successfully."));
});


export const getAllPublishedVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        sortType = "latest"
    } = req.query;

    const currentPage = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);

    let sortQuery = {};
    switch (sortType) {
        case "most-viewed":
            sortQuery = { views: -1 };
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
                isPublished: true
            }
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
                            _id: 1
                        }
                    }
                ]
            },

        },
        {
            $sort: sortQuery
        },
        {
            $skip: (currentPage - 1) * pageSize
        },
        {
            $limit: pageSize
        }
    ])

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No Videos Found.");
    }

    const totalVideos = await Video.countDocuments(filter);
    const totalPages = Math.ceil(totalVideos / pageSize);

    res.status(200).json(new ApiResponse(200, {
        videos,
        totalVideos,
        totalPages,
        currentPage
    }, "Videos Fetched Successfully."));
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

    const thumbnailUploadResponse = await uploadToCloudinary(localThumbnail);
    if (!thumbnailUploadResponse) {
        throw new ApiError(500, "Failed to upload thumbnail to cloud.");
    }

    const thumbnail = await Video.findById(videoId).select("thumbnail");

    const video = await Video.findByIdAndUpdate(videoId, {
        thumbnail: thumbnailUploadResponse.secure_url
    }, { new: true });

    if (!video) {
        throw new ApiError(404, "Video Not Found.");
    }

    if (thumbnail) {
        await deleteFromCloudinary(extractPublicId(thumbnail))
    }

    res
        .status(200)
        .json(new ApiResponse(200, video, "Thumbnail Updated Successfully."));
})

export const getAllVideosByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID Is Required.");
    }

    const videos = await Video.find({ creator: userId })
        .sort({ createdAt: -1, isPublished: -1 });

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No Videos Found For This User.");
    }

    res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos Fetched Successfully."));
});