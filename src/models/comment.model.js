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
    content: {
        type: String,
        enum: ["Video", "Post"],
        required: true,
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "content",
        required: true,
    }
}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema)