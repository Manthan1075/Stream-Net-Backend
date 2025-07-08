import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    likeBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        enum: ["Video", "Post", "Comment"],
        required: true,
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "content",
        required: true,
    },
}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchema);