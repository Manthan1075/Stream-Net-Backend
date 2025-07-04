import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/apiError.js'
import { deleteFromCloudinary, uploadToCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js';
import { Subscription } from '../models/subscription.model.js';

// Register User 

export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImgLocalPath = req.files?.coverImg[0]?.path;


    if (!username || !email || !password || !fullName) {
        throw new ApiError(400, 'All fields are required');
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    let avatar;
    if (avatarLocalPath) {
        avatar = await uploadToCloudinary(avatarLocalPath);
    }
    let coverImg;
    if (coverImgLocalPath) {
        coverImg = await uploadToCloudinary(coverImgLocalPath);
    }

    if (!avatar || avatar === "") {
        throw new ApiError(500, 'Avatar upload failed');
    }

    if (!coverImg || coverImg === "") {
        throw new ApiError(500, 'Cover Image upload failed');
    }

    const user = await User.create({
        username,
        email,
        password,
        fullName,
        avatar,
        coverImg: coverImg || "",
    })

    if (!user) {
        throw new ApiError(500, 'User registration failed');
    }

    res.status(201).json(
        new ApiResponse(201, {
            user,
        }, 'User registered successfully')
    );

})

// Login User

export const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!(username || email) && !password) {
        throw new ApiError(400, "All Fields Are Required")
    }

    const user = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (!user) {
        throw new ApiError(404, "User Not Found")
    }

    const isPasswordMatched = user.comparePassword(password);

    if (!isPasswordMatched) {
        throw new ApiError(401, "Incorrect username/email or password");
    }

    const accessToken = await user.generateAccessToken();

    res
        .status(200)
        .cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 3 * 24 * 60 * 60 * 1000
        })
        .json(
            new ApiResponse(200, user, "User Logged In Successfully")
        );
})

// Logout User

export const logoutUser = asyncHandler(async (req, res) => {

    res
        .clearCookie('accessToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        })
        .status(200)
        .json(
            new ApiResponse(200, {}, "User Logged Out Successfully")
        )
}
)

// Update user Profile

export const updateUserProfile = asyncHandler(async (req, res) => {
    const { fullName, username, email } = req.body;

    console.log("Update User Profile Request Body:", req.body);

    if (!fullName || !username || !email) {
        throw new ApiError(400, 'All Fields Are Required');
    }

    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Accsess');
    }


    if (req.user.username === username && req.user.email === email && req.user.fullName === fullName) {
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
                email
            }
        },
        {
            new: true,
            runValidators: true,
        }
    ).select("-password");

    console.debug("Updated User:", updatedUser);

    if (!updatedUser) {
        throw new ApiError(500, "Problem occurs while Updating User");
    }


    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User Updated Successfully"))
});

// Change Password

export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "All Fields Are Required")
    }

    const user = await User.findById(req.user._id);

    const decodedPassword = await user.comparePassword(oldPassword);

    if (decodedPassword) {
        throw new ApiError(401, "Password Not Matched");
    }

    const updatedUser = await User.findOneAndUpdate(
        user._id,
        {
            password: newPassword,
        });

    if (!updatedUser) {
        throw new ApiError(500, "Problem Occur While Changing Password")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Password Changed Successfully"))
})

//TODO : Forget Password



// Change Avatar

export const changeAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required');
    }

    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Access');
    }


    const avatar = await uploadToCloudinary(avatarLocalPath?.path);


    if (!avatar || avatar === "") {
        throw new ApiError(500, 'Avatar upload failed');
    }

    await deleteFromCloudinary(req.user?.avatar, "image");
    console.log("Delete Image:", req.user.avatar);


    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { avatar },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        throw new ApiError(500, 'Problem occurs while updating avatar');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar Updated Successfully"))
})

// Change Cover Image

export const changeCoverImage = asyncHandler(async (req, res) => {
    const coverImgLocalPath = req.file;


    if (!coverImgLocalPath) {
        throw new ApiError(400, 'Cover Image is required');
    }

    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Access');
    }

    const coverImg = await uploadToCloudinary(coverImgLocalPath.path);

    if (!coverImg || coverImg === " ") {
        throw new ApiError(500, 'Cover Image upload failed');
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { coverImg },
        { new: true }
    ).select("-password");

    // await deleteFromCloudinary(req.user.coverImg);
    if (!updatedUser) {
        throw new ApiError(500, 'Problem occurs while updating Cover Image');
    }


    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Cover Image Updated Successfully"))
})

// Get User Profile

export const getUserProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Access');
    }

    const user = await User.findById(req.user._id).select("-password        ");

    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Profile Retrieved Successfully"));
});

// Add Subscriber to Channel

export const addSubscriber = asyncHandler(async (req, res) => {
    const { channelId } = req.body;
    if (!channelId) {
        throw new ApiError(400, 'Channel ID is required');
    }
    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Access');
    }

    const subscription = Subscription.create({
        channel: req.user._id,
        subscriber: subscriberId
    })

    if (!subscription) {
        throw new ApiError(500, 'Subscription creation failed');
    }

    res
        .status(200)
        .json(new ApiResponse(200, subscription, "Subscription added successfully"));

})

export const removeSubscriber = asyncHandler(async (req, res) => {
    const { channelId } = req.body;
    if (!channelId) {
        throw new ApiError(400, 'Channel ID is required');
    }

    const subscription = await Subscription.findOneAndDelete({
        channel: channelId,
        subscriber: req.user?._id
    });

    if (!subscription) {
        throw new ApiError(404, 'Subscription not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Subscription removed successfully"));
})

export const fetchSubscribers = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Access');
    }
    const subscriptions = await Subscription.find({ subscriber: req.user._id })
        .populate('channel', 'username avatar coverImg fullName');
    if (!subscriptions || subscriptions.length === 0) {
        return res
            .status(404)
            .json(new ApiResponse(404, [], "No subscriptions found"));
    }
    return res
        .status(200)
        .json(new ApiResponse(200, subscriptions, "Subscriptions fetched successfully"));
})

export const fetchSubscription = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Access');
    }
    const Subscribers = await Subscription.find({ channel: req.user._id })
        .populate('subscriber', 'username avatar coverImg fullName');
    if (!Subscribers || Subscribers.length === 0) {
        return res
            .status(404)
            .json(new ApiResponse(404, [], "No Subscribers found"));
    }
    return res
        .status(200)
        .json(new ApiResponse(200, Subscribers, "Subscribers fetched successfully"));
})