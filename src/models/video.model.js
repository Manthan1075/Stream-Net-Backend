import mongoose from "mongoose";
import mongooseAggrefatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true,
    },
    videoFile: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    description: {
        type: String,
        index: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    duration: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: false
    },

}, { timestamps: true });

videoSchema.index({ title: 'text', description: 'text' });
videoSchema.plugin(mongooseAggrefatePaginate)

export const Video = mongoose.model('Video', videoSchema)