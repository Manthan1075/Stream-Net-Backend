import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const authMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken || req.headers.Authorization?.replace('Bearer ', '');

    // console.log("Token from cookies or headers:", token);


    if (!token) {
        throw new ApiError(401, 'unauthorized Access');
    }
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decode) {
        throw new ApiError(401, 'unauthorized Access');
    }
    const user = await User.findById(decode._id)
    if (!user) {
        throw new ApiError(401, 'unauthorized Access');
    }
    req.user = user;
    next();
})