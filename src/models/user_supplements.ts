import mongoose, { ObjectId } from "mongoose";

const userSupplementsSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    supplementId: {
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
        required: false
    },
    isActive: {
        type: Boolean,
        required: true
    },
    personalRating: {
        type: Number,
        required: false
    },
    effectiveness: {
        type: Number,
        required: false
    },
    notes: {
        type: String,
        required: false
    },
    prescribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    relatedMeeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting",
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

export default UserSupplements;