import mongoose, { ObjectId } from "mongoose";
import { EnterprisePlanType } from "./constants";

const enterpriseSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    users: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    comments: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Comment",
        required: false
    },
    supplements: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Supplement",
        required: false
    },
    meetings: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Meeting",
        required: false
    },
    advisors: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Advisor",
        required: false
    }
});

interface Enterprise extends mongoose.Document {
    _id: ObjectId,
    name: string,
    email: string,
    contactPerson?: string,
    phone?: string,
    
    plan: EnterprisePlanType,
    maxUsers: number,
    
    // Plan özellikleri ✅ Ekle
    planFeatures?: {
        meetingsPerUserPerMonth: number, // Her kullanıcı ayda kaç meeting
        prioritySupport: boolean,
        customBranding: boolean,
        analyticsAccess: boolean
    },
    
    users: ObjectId[], // ref: User
    
    // Billing ✅ Ekle (ileride)
    subscriptionStartDate?: Date,
    subscriptionEndDate?: Date,
    
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date
}

const Enterprise = mongoose.model<Enterprise>("Enterprise", enterpriseSchema);

export default Enterprise;