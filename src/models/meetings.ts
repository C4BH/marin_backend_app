import mongoose, { ObjectId } from "mongoose";
import { MeetingStatusType, AllMeetingStatuses } from "./constants";

const meetingSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    advisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Advisor",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: AllMeetingStatuses,
        required: true
    },
    userRating: {
        type: Number,
        required: false
    },
    advisorRating: {
        type: Number,
        required: false
    },
    userRatingNote: {
        type: String,
        required: false
    },
    advisorRatingNote: {
        type: String,
        required: false
    },
    advisorNotes: {
        type: String,
        required: false
    },
    discussedSupplements: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Supplement",
        required: false
    },
    recommendations: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Supplement",
        required: false
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    cancellationReason: {
        type: String,
        required: false
    },
    completedAt: {
        type: Date,
        required: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

interface Meeting extends mongoose.Document {
    _id: ObjectId,
    user: ObjectId,
    advisor: ObjectId,
    
    scheduledTime: Date, // 'time' yerine daha açıklayıcı
    duration: number, // Number yerine number (lowercase)
    status: MeetingStatusType, // enum olmalı
    
    // Meeting sonrası
    userRating?: number,
    advisorRating?: number,
    userRatingNote?: string,
    advisorRatingNote?: string,
    
    // Notlar ve öneriler
    advisorNotes?: string, // ⭐ Eksik - Advisor'ın toplantı notları
    discussedSupplements?: ObjectId[], // ⭐ Eksik - Konuşulan takviyeler
    recommendations?: ObjectId[], // ⭐ Eksik - Önerilen takviyeler
    
    // İptal bilgisi
    cancelledBy?: ObjectId, // User mı advisor mı iptal etti
    cancellationReason?: string,
    
    createdAt: Date,
    updatedAt: Date,
    completedAt?: Date
}

const Meeting = mongoose.model<Meeting>("Meeting", meetingSchema);

export default Meeting;