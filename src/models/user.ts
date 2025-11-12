import mongoose, { ObjectId } from "mongoose";
import {
    AuthProviderType,
    GenderType,
    UserRoleType,
    AllUserRoles
} from "./constants";

const userSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    role: {
        type: String,
        enum: AllUserRoles,
        required: true
    },
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    verificationCode: {
        type: String,
        required: false
    },
    verificationCodeExpires: {
        type: Date,
        required: false
    },
    password: {
        type: String,
        required: false
    },
    isPasswordEnabled: {
        type: Boolean,
        required: true,
        default: false
    },
    meetings: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Meeting",
        required: false
    },
    supplements: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Supplement",
        required: false
    },
    UserSupplements: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "UserSupplement",
        required: false
    },
    comments: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Comment",
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    FormResponses: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "FormResponse",
        required: false
    },
    advisorProfile: {
        type: Object,
        required: false,
        default: {
            specialization: [],
            bio: "",
            certifications: [],
            experience: 0,
            averageRating: 0,
            totalReviews: 0
        }
    },
    refreshTokens: {
        type: [{
            token: {
                type: String,
                required: true
            },
            device: {
                type: String,
                required: true
            },
            expiresAt: {
                type: Date,
                required: true
            }
        }],
        default: []
    },
    lastLoginAt: {
        type: Date,
        required: false
    }
});

interface User extends mongoose.Document {
    _id: ObjectId,
    
    // Temel bilgiler
    name: string,
    email: string,
    password?: string, // Social login varsa opsiyonel
    phone?: string,
    
    // Role
    role: UserRoleType,
    
    // Auth
    isEmailVerified: boolean,
    verificationCode?: string,
    verificationCodeExpires?: Date,
    isPasswordEnabled: boolean,
    refreshTokens: Array<{
        token: string,
        device: string,
        expiresAt: Date
    }>,
    
    // Social login
    authProvider?: {
        type: AuthProviderType,
        providerId?: string,
        providerData?: any
    },
    
    // Profile
    dateOfBirth?: Date,
    gender?: GenderType,
    height?: number,
    weight?: number,
    
    // İlişkiler
    enterpriseId?: ObjectId, // ref: Enterprise
    
    // Stats
    meetingStats?: {
        totalMeetings: number,
        completedMeetings: number,
        cancelledMeetings: number,
        noShowCount: number
    },
    
    // Timestamps
    createdAt: Date,
    updatedAt: Date,
    lastLoginAt?: Date
        // Advisor özel bilgileri (role === 'advisor' ise)
        advisorProfile?: {
            specialization: string[],
            bio: string,
            certifications: string[],
            experience: number, // yıl
            averageRating: number,
            totalReviews: number
            isAvailable: boolean, // ✅ Ekle - Meeting alıyor mu?
            hourlyRate?: number // ✅ Ekle - İleride ücretli danışmanlık için Kişiye özel ücretlendirme yapılırsa diye var
        }
}

// Model'i oluştur veya mevcut olanı kullan (hot-reload için)
// mongoose.models.User varsa onu kullan, yoksa yenisini oluştur
// Bu, hot-reload sırasında "Cannot overwrite model" hatasını önler
const User = mongoose.models.User || mongoose.model<User>("User", userSchema);

export default User;