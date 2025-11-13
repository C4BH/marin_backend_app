import mongoose, { ObjectId } from "mongoose";
import { CommentTargetTypeValue, AllCommentTargetTypes } from "./constants";
const commentSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    targetType: {
        type: String,
        enum: AllCommentTargetTypes,
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    text: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

interface Comment extends mongoose.Document {
    _id: ObjectId,
    rating: number,
    author: ObjectId,
    targetType: CommentTargetTypeValue,
    targetId: ObjectId,
    text: string,
    createdAt: Date,
    updatedAt: Date // ✅ Ekle
}

const Comment = mongoose.model<Comment>("Comment", commentSchema);

export default Comment;