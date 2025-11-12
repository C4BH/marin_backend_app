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
    time: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    userRating: {
        type: Number,
        required: true
    },
    advisorRating: {
        type: Number,
        required: true
    },
    userRatingNote: {
        type: String,
        required: true
    },
    advisorRatingNote: {
        type: String,
        required: true
    },
    meetingStatus: {
        type: String,
        enum: AllMeetingStatuses,
        required: true
    },
    cancellationReason: {
        type: String,
        required: true
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