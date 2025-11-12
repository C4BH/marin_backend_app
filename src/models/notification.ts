import mongoose, { ObjectId } from "mongoose";
import {
    NotificationStatusType,
    NotificationTypeType,
    AllNotificationTypes,
    AllNotificationStatuses
} from "./constants";

const notificationSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: AllNotificationTypes,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    scheduledFor: {
        type: Date,
        required: false
    },
    sentAt: {
        type: Date,
        required: false
    },
    readAt: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        enum: AllNotificationStatuses,
        required: true
    },
    relatedEntity: {
        type: Object,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

interface Notification extends mongoose.Document {
    _id: ObjectId,
    userId: ObjectId,
    
    type: NotificationTypeType,
    title: string,
    body: string,
    
    scheduledFor?: Date,
    sentAt?: Date,
    readAt?: Date,
    
    status: NotificationStatusType,
    
    // Metadata
    relatedEntity?: {
        type: 'supplement' | 'meeting' | 'form',
        id: ObjectId
    },
    
    createdAt: Date
}

const Notification = mongoose.model<Notification>("Notification", notificationSchema);