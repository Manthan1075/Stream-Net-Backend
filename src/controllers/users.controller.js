import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/apiError.js'
import { uploadToCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js';
import { Subscription } from '../models/subscription.model.js';

// Register User 

export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImgLocalPath = req.files?.coverImg[0]?.path;

    console.log("REQ Files :", req.files)
    console.log("REQ Body :", req.body)

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

    console.debug("Avatar URL:", avatar);
    console.debug("Cover Image URL:", coverImg);

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

    const isPasswordValid = await User.find({
        password: oldPassword,
        username: req.user.username,
    })

    if (!isPasswordValid) {
        throw new ApiError(401, "Password Not Matched");
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            password: newPassword
        }
    )

    if (!user) {
        throw new ApiError(500, "Problem Occur While Changing Password")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user.select("-password")), "Password Changed Successfully")
})

//TODO : Forget Password



// Change Avatar

export const changeAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.avatar;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required');
    }

    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Access');
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);

    if (!avatar || avatar === "") {
        throw new ApiError(500, 'Avatar upload failed');
    }

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
    const coverImgLocalPath = req.file?.coverImg;

    if (!coverImgLocalPath) {
        throw new ApiError(400, 'Cover Image is required');
    }

    if (!req.user) {
        throw new ApiError(401, 'Unauthorized Access');
    }

    const coverImg = await uploadToCloudinary(coverImgLocalPath);

    if (!coverImg || coverImg === "") {
        throw new ApiError(500, 'Cover Image upload failed');
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { coverImg },
        { new: true }
    ).select("-password");

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

export const addSubscriber = asyncHandler(async (req, res) => {
    const { channelId, subscriberId } = req.body;

    if (!channelId && !subscriberId) {
        throw new ApiError(400, "All Fileds Required")
    }

    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(404, "Channel Not Found");
    }

    const subscriber = await User.findById(subscriberId);

    if (!subscriber) {
        throw new ApiError(404, "Subscriber Not Found");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId
    });

    if (existingSubscription) {
        throw new ApiError(409, "You are already subscribed to this channel");
    }

    const subscription = await Subscription.create({
        channel: channelId,
        subscriber: subscriberId
    });


})