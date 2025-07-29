import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { deleteLocalFile } from '../middlewares/multer.middleware.js'
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { extractPublicId } from "cloudinary-build-url";
import { Subscription } from "../models/subscription.model.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  const avatarLocalPath = req?.files?.avatar[0]?.path || null;
  const coverImgLocalPath = req?.files?.coverImg[0]?.path || null;


  if (!username || !email || !password || !fullName) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });


  if (existedUser) {
    if (avatarLocalPath) deleteLocalFile(avatarLocalPath)
    if (coverImgLocalPath) deleteLocalFile(coverImgLocalPath)
    throw new ApiError(409, "User with email or username already exists");
  }

  let avatar = null;
  if (avatarLocalPath && avatarLocalPath !== "") {
    avatar = await uploadToCloudinary(avatarLocalPath);
  }
  let coverImg;
  if (coverImgLocalPath && coverImgLocalPath !== "") {
    coverImg = await uploadToCloudinary(coverImgLocalPath);
  }

  if (avatarLocalPath && (!avatar || avatar === "")) {
    throw new ApiError(500, "Avatar upload failed");
  }

  if (coverImgLocalPath && (!coverImg || coverImg === "")) {
    throw new ApiError(500, "Cover Image upload failed");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    avatar: avatar?.secure_url ? avatar?.secure_url : "",
    coverImg: coverImg?.secure_url ? avatar?.secure_url : "",
  });

  if (!user) {
    throw new ApiError(500, "User registration failed");
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user,
      },
      "User registered successfully"
    )
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { login, password } = req.body;

  if (!login && !password) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const user = await User.findOne({
    $or: [{ username: login }, { email: login }],
  });

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  const isPasswordMatched = user.comparePassword(password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Incorrect username/email or password");
  }

  const accessToken = await user.generateAccessToken();

  res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    })
    .json(new ApiResponse(200, user, "User Logged In Successfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
  res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, username, email } = req.body;

  if (!fullName || !username || !email) {
    throw new ApiError(400, "All Fields Are Required");
  }

  if (!req.user) {
    throw new ApiError(401, "Unauthorized Accsess");
  }

  if (
    req.user.username === username &&
    req.user.email === email &&
    req.user.fullName === fullName
  ) {
    throw new ApiError(400, "No Changes Made In User Profile");
  }

  const existingUsername = await User.find({ username });

  if (existingUsername && existingUsername?.length > 0) {
    throw new ApiError(400, "username is already exist");
  }

  const existingEmail = await User.find({ email });

  if (existingEmail && existingEmail.length > 0) {
    throw new ApiError(400, "email is already exist");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        username,
        email,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(500, "Problem occurs while Updating User");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User Updated Successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const user = await User.findById(req.user._id);

  const decodedPassword = await user.comparePassword(oldPassword);

  if (decodedPassword) {
    throw new ApiError(401, "Password Not Matched");
  }

  const updatedUser = await User.findOneAndUpdate(user._id, {
    password: newPassword,
  });

  if (!updatedUser) {
    throw new ApiError(500, "Problem Occur While Changing Password");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Password Changed Successfully"));
});

export const forgetPassword = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username Or email Required!")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

}) //Incomplete

export const changeAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath?.path);

  if (!avatar || avatar === "") {
    throw new ApiError(500, "Avatar upload failed");
  }

  await deleteFromCloudinary(extractPublicId(req.user.avatar), "image");

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatar.secure_url || "" },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(500, "Problem occurs while updating avatar");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar Updated Successfully"));
});

export const changeCoverImage = asyncHandler(async (req, res) => {
  const coverImgLocalPath = req.file;
  if (!coverImgLocalPath) {
    throw new ApiError(400, "Cover Image is required");
  }

  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const coverImg = await uploadToCloudinary(coverImgLocalPath.path);

  if (!coverImg || coverImg === " ") {
    throw new ApiError(500, "Cover Image upload failed");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { coverImg: coverImg.secure_url || "" },
    { new: true }
  ).select("-password");

  const deleteResponse = await deleteFromCloudinary(
    extractPublicId(req.user.coverImg),
    "image"
  );

  console.log("Delete Cover Image:", deleteResponse);

  if (!updatedUser) {
    throw new ApiError(500, "Problem occurs while updating Cover Image");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Cover Image Updated Successfully")
    );
});

export const getUserProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  const subscriptions = await Subscription.find({ subscriber: req.user._id })
    .populate("channel", "username fullName avatar")
    .select("channel");

  const subscribers = await Subscription.find({ channel: req.user._id })
    .populate("subscriber", "username fullName avatar")
    .select("subscriber");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        subscriptions: subscriptions.map((s) => s.channel),
        subscribers: subscribers.map((s) => s.subscriber),
      },
      "User Profile Retrieved Successfully"
    )
  );
});

export const fetchProfileDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }


  const user = await User.findById(userId)
    .select("-password -watchHistory")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const subscribers = await Subscription.find({ channel: userId })
    .populate("subscriber", "username fullName avatar")
    .select("subscriber")
    .lean();

  const subscriptions = await Subscription.find({ subscriber: userId })
    .populate("channel", "username fullName avatar")
    .select("channel")
    .lean();

  // Format subscriptions and subscribers as arrays of user/channel objects
  const formattedSubscriptions = subscriptions.map(sub => sub.channel);
  const formattedSubscribers = subscribers.map(sub => sub.subscriber);

  const profile = {
    user: user,
    subscriptions: formattedSubscriptions,
    subscribers: formattedSubscribers,
  };



  if (!profile && profile.length === 0) {
    throw new ApiError(404, "User profile not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "User profile fetched successfully"));
});

export const addTowatchHistory = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.watchHistory.includes(videoId)) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user.watchHistory,
          "Video already in watch history"
        )
      );
  }
  user.watchHistory.push(videoId);
  await user.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.watchHistory,
        "Video added to watch history successfully"
      )
    );
});

export const removeFromWatchHistory = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  user.watchHistory = user.watchHistory.filter(
    (id) => id.toString() !== videoId
  );
  await user.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.watchHistory,
        "Video removed from watch history successfully"
      )
    );
});

export const fetchWatchHistory = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.watchHistory.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No watch history found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.watchHistory,
        "Watch history fetched successfully"
      )
    );
});
