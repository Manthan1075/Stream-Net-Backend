import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const authMiddlware = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        throw new ApiError(401, 'Unauthorizes Access');
    }
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decode) {
        throw new ApiError(401, 'Unauthorizes Access');
    }
    const user = await User.findById(decode._id)
    if (!user) {
        throw new ApiError(401, 'Unauthorizes Access');
    }
    req.user = user;
    next();
})