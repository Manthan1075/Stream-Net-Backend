import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/apiError.js'
import { uploadToCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js';

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