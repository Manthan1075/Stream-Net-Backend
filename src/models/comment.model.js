import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    commentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    contentType: {
        type: String,
        enum: ["Video", "Post","Comment"],
        required: true,
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "content",
        required: true,
    }
}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema)