import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const toogleSubscriber = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!channelId) {
      throw new ApiError(400, "Channel ID is required");
    }

    if (!req.user) {
      throw new ApiError(401, "Unauthorized Access");
    }

    const existingSubscripiton = await Subscription.find({
      channel: channelId,
      subscriber: req.user?._id,
    });

    if (existingSubscripiton && existingSubscripiton.length !== 0) {
      const unsubscribed = await Subscription.findOneAndDelete({
        channel: channelId,
        subscriber: req.user?._id,
      });

      if (!unsubscribed) {
        throw new ApiError(500, "Failed To Unsubscribe Channel");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, unsubscribed, "Unsubscribed Channel")
        );
    }

    const subscription = await Subscription.create({
      channel: channelId,
      subscriber: req.user?._id,
    });

    if (!subscription) {
      throw new ApiError(500, "Subscription creation failed");
    }
    console.log("Subscriber : ", subscription);

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscription, "Subscription added successfully")
      );
  } catch (error) {
    console.log("Error In Add Subscribe : ", error);
  }
});

export const fetchSubscribers = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    throw new ApiError(401, "UserId Required");
  }

  console.log("Fetch Subsriber :: UserId :", userId);


  const subscriptions = await Subscription.find({
    subscriber: userId,
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
  const userId = req.params.userId;

  if (!userId) {
    throw new ApiError(401, "UserId Required");
  }
  const Subscribers = await Subscription.find({
    channel: userId,
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
