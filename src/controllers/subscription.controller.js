import { Subscription } from "../models/subscription.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addSubscriber = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const subscription = Subscription.create({
    channel: req.user._id,
    subscriber: subscriberId,
  });

  if (!subscription) {
    throw new ApiError(500, "Subscription creation failed");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, subscription, "Subscription added successfully")
    );
});

export const removeSubscriber = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  const subscription = await Subscription.findOneAndDelete({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Subscription removed successfully"));
});

export const fetchSubscribers = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }
  const subscriptions = await Subscription.find({
    subscriber: req.user._id,
  }).populate("channel", "username avatar coverImg fullName");
  if (!subscriptions || subscriptions.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No subscriptions found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscriptions, "Subscriptions fetched successfully")
    );
});

export const fetchSubscription = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }
  const Subscribers = await Subscription.find({
    channel: req.user._id,
  }).populate("subscriber", "username avatar coverImg fullName");
  if (!Subscribers || Subscribers.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No Subscribers found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, Subscribers, "Subscribers fetched successfully")
    );
});
