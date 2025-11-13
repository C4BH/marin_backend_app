import mongoose, { ObjectId } from "mongoose";
import {
    AuthProviderType,
    GenderType,
    UserRoleType,
    AllUserRoles,
    AllGenders,
    AllAuthProviders
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
        type: {
            specialization: {
                type: [String],
                default: []
            },
            bio: {
                type: String,
                default: ""
            },
            certifications: {
                type: [String],
                default: []
            },
            experience: {
                type: Number,
                default: 0
            },
            averageRating: {
                type: Number,
                default: 0
            },
            totalReviews: {
                type: Number,
                default: 0
            },
            isAvailable: {
                type: Boolean,
                default: true
            },
            hourlyRate: {
                type: Number,
                required: false
            }
        },
        required: false,
        default: {
            specialization: [],
            bio: "",
            certifications: [],
            experience: 0,
            averageRating: 0,
            totalReviews: 0,
            isAvailable: true
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
    weight: {
        type: Number,
        required: false
    },
    height: {
        type: Number,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: Date,
        required: false
    },
    gender: {
        type: String,
        enum: AllGenders,
        required: false
    },
    enterpriseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enterprise",
        required: false
    },
    meetingStats: {
        type: {
            totalMeetings: {
                type: Number,
                default: 0
            },
            completedMeetings: {
                type: Number,
                default: 0
            },
            cancelledMeetings: {
                type: Number,
                default: 0
            },
            noShowCount: {
                type: Number,
                default: 0
            }
        },
        required: false
    },
    authProvider: {
        type: {
            providerType: {
                type: String,
                enum: AllAuthProviders,
                required: true
            },
            providerId: {
                type: String,
                required: false
            },
            providerData: {
                type: mongoose.Schema.Types.Mixed,
                required: false
            }
        },
        required: false,
        _id: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
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
        providerType: AuthProviderType,
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