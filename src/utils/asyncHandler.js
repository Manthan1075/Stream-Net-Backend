
const asyncHandler = (func) => async (req, res, next) => {
    try {
        return await func(req, res, next);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error',
        })
    }
}

export default asyncHandler;