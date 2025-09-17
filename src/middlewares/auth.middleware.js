import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const authMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken || req.headers.Authorization?.replace('Bearer ', '');

    if (!token) {
        req.user = null;
        return next();
    }
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decode) {
        req.user = null;
        next()
    }
    const user = await User.findById(decode._id)
    if (!user) {
        req.user = null;
        next()
    }
    req.user = user;
    next();
})