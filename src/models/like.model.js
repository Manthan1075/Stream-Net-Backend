import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    likeBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    contentType: {
        type: String,
        enum: ["video", "comment", "communityPost"],
        required: true
    },

}, { timestamps: true })

export const Like = mongoose.model("Like", likeSchema);