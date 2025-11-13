export const UserRole = {
    USER: 'user',
    ADVISOR: 'advisor',
    ADMIN: 'admin',
} as const;

export const Gender = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
} as const;

export const AuthProvider = {
    EMAIL: 'email',
    GOOGLE: 'google',
    APPLE: 'apple'
} as const;

export const SupplementForm = {
    TABLET: 'tablet',
    CAPSULE: 'capsule',
    POWDER: 'powder',
    LIQUID: 'liquid',
    GUMMY: 'gummy'
} as const;

export const Effectiveness = {
    LOW: 'low',
    MODERATE: 'moderate',
    HIGH: 'high'
} as const;

export const SourceType = {
    VADEMECUM: 'vademecum',
    CONSENSUS: 'consensus',
    MANUAL: 'manual'
} as const;

export const MeetingStatus = {
    SCHEDULED: 'scheduled',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show'
} as const;

export const NotificationType = {
    SUPPLEMENT_REMINDER: 'supplement_reminder',
    MEETING_REMINDER: 'meeting_reminder',
    FORM_DUE: 'form_due',
    MEETING_REQUEST: 'meeting_request'
} as const;

export const NotificationStatus = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    READ: 'read'
} as const;

export const FormCategory = {
    HEALTH: 'health',
    LIFESTYLE: 'lifestyle',
    DIET: 'diet',
    GOALS: 'goals',
    MEDICAL_HISTORY: 'medical_history'
} as const;

export const FormAnswerType = {
    TEXT: 'text',
    MULTIPLE_CHOICE: 'multiple_choice',
    RATING: 'rating',
    YES_NO: 'yes_no',
    NUMBER: 'number'
} as const;

export const SubscriptionPlan = {
    FREE: 'free',
    PERSONAL: 'personal',
    ENTERPRISE: 'enterprise'
} as const;



export const EnterprisePlan = {
    BRONZE: 'bronze',
    SILVER: 'silver',
    GOLD: 'gold'
} as const;

export const SubscriptionStatus = {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    TRIAL: 'trial',
    PAYMENT_FAILED: 'payment_failed'
} as const;



export const CommentTargetType = {
    SUPPLEMENT: 'supplement',
    ADVISOR: 'advisor',
    MEETING: 'meeting'
} as const;

// Type inference için
export type UserRoleType = typeof UserRole[keyof typeof UserRole];
export type GenderType = typeof Gender[keyof typeof Gender];
export type AuthProviderType = typeof AuthProvider[keyof typeof AuthProvider];
export type SupplementFormType = typeof SupplementForm[keyof typeof SupplementForm];
export type EffectivenessType = typeof Effectiveness[keyof typeof Effectiveness];
export type SourceTypeType = typeof SourceType[keyof typeof SourceType];
export type MeetingStatusType = typeof MeetingStatus[keyof typeof MeetingStatus];
export type NotificationTypeType = typeof NotificationType[keyof typeof NotificationType];
export type NotificationStatusType = typeof NotificationStatus[keyof typeof NotificationStatus];
export type FormCategoryType = typeof FormCategory[keyof typeof FormCategory];
export type FormAnswerTypeValue = typeof FormAnswerType[keyof typeof FormAnswerType];
export type EnterprisePlanType = typeof EnterprisePlan[keyof typeof EnterprisePlan];
export type CommentTargetTypeValue = typeof CommentTargetType[keyof typeof CommentTargetType];
export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];
export type SubscriptionPlanType = typeof SubscriptionPlan[keyof typeof SubscriptionPlan];
// Object.values kullanımında tekrar etmemek için yardımcı export
export const AllUserRoles = Object.values(UserRole);
export const AllGenders = Object.values(Gender);
export const AllAuthProviders = Object.values(AuthProvider);
export const AllSupplementForms = Object.values(SupplementForm);
export const AllEffectivenessLevels = Object.values(Effectiveness);
export const AllSourceTypes = Object.values(SourceType);
export const AllMeetingStatuses = Object.values(MeetingStatus);
export const AllNotificationTypes = Object.values(NotificationType);
export const AllNotificationStatuses = Object.values(NotificationStatus);
export const AllFormCategories = Object.values(FormCategory);
export const AllFormAnswerTypes = Object.values(FormAnswerType);
export const AllEnterprisePlans = Object.values(EnterprisePlan);
export const AllCommentTargetTypes = Object.values(CommentTargetType);

