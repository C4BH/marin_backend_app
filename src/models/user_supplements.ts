import mongoose, { ObjectId } from "mongoose";

const userSupplementsSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    supplement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplement",
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    usage: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        required: true
    },
    timing: {
        type: String,
        required: true
    },
    goals: {
        type: [String],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true
    },
    personalRating: {
        type: Number,
        required: true
    },
    effectiveness: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        required: true
    },
    prescribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Advisor",
        required: true
    },
    relatedMeeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting",
        required: true
    }
});

interface UserSupplements extends mongoose.Document {
    userId: ObjectId,
    supplementId: ObjectId,
    
    // Kullanım bilgileri
    quantity: number,
    usage: string,
    frequency: string,
    timing: string,
    
    // Amaç ve takip
    goals: string[],
    startDate: Date,
    endDate?: Date,
    isActive: boolean,
    
    // Değerlendirme
    personalRating?: number,
    effectiveness?: number,
    notes?: string,
    
    // İlişkiler (opsiyonel)
    prescribedBy?: ObjectId, // ref: User
    relatedMeeting?: ObjectId, // ref: Meeting
    
    createdAt: Date,
    updatedAt: Date
}

const UserSupplements = mongoose.model<UserSupplements>("UserSupplements", userSupplementsSchema);