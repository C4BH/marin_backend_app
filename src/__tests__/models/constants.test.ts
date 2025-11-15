import { describe, it, expect } from 'vitest';
import {
    UserRole,
    Gender,
    AuthProvider,
    SupplementForm,
    Effectiveness,
    SourceType,
    MeetingStatus,
    NotificationType,
    NotificationStatus,
    FormCategory,
    FormAnswerType,
    SubscriptionPlan,
    EnterprisePlan,
    SubscriptionStatus,
    CommentTargetType,
    AllUserRoles,
    AllGenders,
    AllAuthProviders,
    AllSupplementForms,
    AllEffectivenessLevels,
    AllSourceTypes,
    AllMeetingStatuses,
    AllNotificationTypes,
    AllNotificationStatuses,
    AllFormCategories,
    AllFormAnswerTypes,
    AllEnterprisePlans,
    AllCommentTargetTypes
} from '../../models/constants';

describe('Constants', () => {
    describe('UserRole', () => {
        it('should have correct user role values', () => {
            expect(UserRole.USER).toBe('user');
            expect(UserRole.ADVISOR).toBe('advisor');
            expect(UserRole.ADMIN).toBe('admin');
        });

        it('should have all role values in AllUserRoles array', () => {
            expect(AllUserRoles).toContain('user');
            expect(AllUserRoles).toContain('advisor');
            expect(AllUserRoles).toContain('admin');
            expect(AllUserRoles.length).toBe(3);
        });
    });

    describe('Gender', () => {
        it('should have correct gender values', () => {
            expect(Gender.MALE).toBe('Male');
            expect(Gender.FEMALE).toBe('Female');
            expect(Gender.OTHER).toBe('Other');
        });

        it('should have all gender values in AllGenders array', () => {
            expect(AllGenders).toContain('Male');
            expect(AllGenders).toContain('Female');
            expect(AllGenders).toContain('Other');
            expect(AllGenders.length).toBe(3);
        });
    });

    describe('AuthProvider', () => {
        it('should have correct auth provider values', () => {
            expect(AuthProvider.EMAIL).toBe('email');
            expect(AuthProvider.GOOGLE).toBe('google');
            expect(AuthProvider.APPLE).toBe('apple');
        });

        it('should have all auth provider values in AllAuthProviders array', () => {
            expect(AllAuthProviders).toContain('email');
            expect(AllAuthProviders).toContain('google');
            expect(AllAuthProviders).toContain('apple');
            expect(AllAuthProviders.length).toBe(3);
        });
    });

    describe('SupplementForm', () => {
        it('should have correct supplement form values', () => {
            expect(SupplementForm.TABLET).toBe('tablet');
            expect(SupplementForm.CAPSULE).toBe('capsule');
            expect(SupplementForm.POWDER).toBe('powder');
            expect(SupplementForm.LIQUID).toBe('liquid');
            expect(SupplementForm.GUMMY).toBe('gummy');
        });

        it('should have all supplement form values in AllSupplementForms array', () => {
            expect(AllSupplementForms).toContain('tablet');
            expect(AllSupplementForms).toContain('capsule');
            expect(AllSupplementForms).toContain('powder');
            expect(AllSupplementForms).toContain('liquid');
            expect(AllSupplementForms).toContain('gummy');
            expect(AllSupplementForms.length).toBe(5);
        });
    });

    describe('Effectiveness', () => {
        it('should have correct effectiveness values', () => {
            expect(Effectiveness.LOW).toBe('low');
            expect(Effectiveness.MODERATE).toBe('moderate');
            expect(Effectiveness.HIGH).toBe('high');
        });

        it('should have all effectiveness values in AllEffectivenessLevels array', () => {
            expect(AllEffectivenessLevels).toContain('low');
            expect(AllEffectivenessLevels).toContain('moderate');
            expect(AllEffectivenessLevels).toContain('high');
            expect(AllEffectivenessLevels.length).toBe(3);
        });
    });

    describe('SourceType', () => {
        it('should have correct source type values', () => {
            expect(SourceType.VADEMECUM).toBe('vademecum');
            expect(SourceType.CONSENSUS).toBe('consensus');
            expect(SourceType.MANUAL).toBe('manual');
        });

        it('should have all source type values in AllSourceTypes array', () => {
            expect(AllSourceTypes).toContain('vademecum');
            expect(AllSourceTypes).toContain('consensus');
            expect(AllSourceTypes).toContain('manual');
            expect(AllSourceTypes.length).toBe(3);
        });
    });

    describe('MeetingStatus', () => {
        it('should have correct meeting status values', () => {
            expect(MeetingStatus.SCHEDULED).toBe('scheduled');
            expect(MeetingStatus.COMPLETED).toBe('completed');
            expect(MeetingStatus.CANCELLED).toBe('cancelled');
            expect(MeetingStatus.NO_SHOW).toBe('no_show');
        });

        it('should have all meeting status values in AllMeetingStatuses array', () => {
            expect(AllMeetingStatuses).toContain('scheduled');
            expect(AllMeetingStatuses).toContain('completed');
            expect(AllMeetingStatuses).toContain('cancelled');
            expect(AllMeetingStatuses).toContain('no_show');
            expect(AllMeetingStatuses.length).toBe(4);
        });
    });

    describe('NotificationType', () => {
        it('should have correct notification type values', () => {
            expect(NotificationType.SUPPLEMENT_REMINDER).toBe('supplement_reminder');
            expect(NotificationType.MEETING_REMINDER).toBe('meeting_reminder');
            expect(NotificationType.FORM_DUE).toBe('form_due');
            expect(NotificationType.MEETING_REQUEST).toBe('meeting_request');
        });

        it('should have all notification type values in AllNotificationTypes array', () => {
            expect(AllNotificationTypes).toContain('supplement_reminder');
            expect(AllNotificationTypes).toContain('meeting_reminder');
            expect(AllNotificationTypes).toContain('form_due');
            expect(AllNotificationTypes).toContain('meeting_request');
            expect(AllNotificationTypes.length).toBe(4);
        });
    });

    describe('NotificationStatus', () => {
        it('should have correct notification status values', () => {
            expect(NotificationStatus.PENDING).toBe('pending');
            expect(NotificationStatus.SENT).toBe('sent');
            expect(NotificationStatus.FAILED).toBe('failed');
            expect(NotificationStatus.READ).toBe('read');
        });

        it('should have all notification status values in AllNotificationStatuses array', () => {
            expect(AllNotificationStatuses).toContain('pending');
            expect(AllNotificationStatuses).toContain('sent');
            expect(AllNotificationStatuses).toContain('failed');
            expect(AllNotificationStatuses).toContain('read');
            expect(AllNotificationStatuses.length).toBe(4);
        });
    });

    describe('FormCategory', () => {
        it('should have correct form category values', () => {
            expect(FormCategory.HEALTH).toBe('health');
            expect(FormCategory.LIFESTYLE).toBe('lifestyle');
            expect(FormCategory.DIET).toBe('diet');
            expect(FormCategory.GOALS).toBe('goals');
            expect(FormCategory.MEDICAL_HISTORY).toBe('medical_history');
        });

        it('should have all form category values in AllFormCategories array', () => {
            expect(AllFormCategories).toContain('health');
            expect(AllFormCategories).toContain('lifestyle');
            expect(AllFormCategories).toContain('diet');
            expect(AllFormCategories).toContain('goals');
            expect(AllFormCategories).toContain('medical_history');
            expect(AllFormCategories.length).toBe(5);
        });
    });

    describe('FormAnswerType', () => {
        it('should have correct form answer type values', () => {
            expect(FormAnswerType.TEXT).toBe('text');
            expect(FormAnswerType.MULTIPLE_CHOICE).toBe('multiple_choice');
            expect(FormAnswerType.RATING).toBe('rating');
            expect(FormAnswerType.YES_NO).toBe('yes_no');
            expect(FormAnswerType.NUMBER).toBe('number');
        });

        it('should have all form answer type values in AllFormAnswerTypes array', () => {
            expect(AllFormAnswerTypes).toContain('text');
            expect(AllFormAnswerTypes).toContain('multiple_choice');
            expect(AllFormAnswerTypes).toContain('rating');
            expect(AllFormAnswerTypes).toContain('yes_no');
            expect(AllFormAnswerTypes).toContain('number');
            expect(AllFormAnswerTypes.length).toBe(5);
        });
    });

    describe('SubscriptionPlan', () => {
        it('should have correct subscription plan values', () => {
            expect(SubscriptionPlan.FREE).toBe('free');
            expect(SubscriptionPlan.PERSONAL).toBe('personal');
            expect(SubscriptionPlan.ENTERPRISE).toBe('enterprise');
        });
    });

    describe('EnterprisePlan', () => {
        it('should have correct enterprise plan values', () => {
            expect(EnterprisePlan.BRONZE).toBe('bronze');
            expect(EnterprisePlan.SILVER).toBe('silver');
            expect(EnterprisePlan.GOLD).toBe('gold');
        });

        it('should have all enterprise plan values in AllEnterprisePlans array', () => {
            expect(AllEnterprisePlans).toContain('bronze');
            expect(AllEnterprisePlans).toContain('silver');
            expect(AllEnterprisePlans).toContain('gold');
            expect(AllEnterprisePlans.length).toBe(3);
        });
    });

    describe('SubscriptionStatus', () => {
        it('should have correct subscription status values', () => {
            expect(SubscriptionStatus.ACTIVE).toBe('active');
            expect(SubscriptionStatus.CANCELLED).toBe('cancelled');
            expect(SubscriptionStatus.EXPIRED).toBe('expired');
            expect(SubscriptionStatus.TRIAL).toBe('trial');
            expect(SubscriptionStatus.PAYMENT_FAILED).toBe('payment_failed');
        });
    });

    describe('CommentTargetType', () => {
        it('should have correct comment target type values', () => {
            expect(CommentTargetType.SUPPLEMENT).toBe('supplement');
            expect(CommentTargetType.ADVISOR).toBe('advisor');
            expect(CommentTargetType.MEETING).toBe('meeting');
        });

        it('should have all comment target type values in AllCommentTargetTypes array', () => {
            expect(AllCommentTargetTypes).toContain('supplement');
            expect(AllCommentTargetTypes).toContain('advisor');
            expect(AllCommentTargetTypes).toContain('meeting');
            expect(AllCommentTargetTypes.length).toBe(3);
        });
    });

    describe('Constant values', () => {
        it('should maintain UserRole values', () => {
            // Values should remain constant
            expect(UserRole.USER).toBe('user');
            expect(UserRole.ADVISOR).toBe('advisor');
            expect(UserRole.ADMIN).toBe('admin');
        });

        it('should maintain Gender values', () => {
            // Values should remain constant
            expect(Gender.MALE).toBe('Male');
            expect(Gender.FEMALE).toBe('Female');
            expect(Gender.OTHER).toBe('Other');
        });
    });

    describe('Arrays integrity', () => {
        it('should have unique values in all arrays', () => {
            const checkUnique = (arr: any[]) => {
                return arr.length === new Set(arr).size;
            };

            expect(checkUnique(AllUserRoles)).toBe(true);
            expect(checkUnique(AllGenders)).toBe(true);
            expect(checkUnique(AllAuthProviders)).toBe(true);
            expect(checkUnique(AllSupplementForms)).toBe(true);
            expect(checkUnique(AllEffectivenessLevels)).toBe(true);
            expect(checkUnique(AllSourceTypes)).toBe(true);
            expect(checkUnique(AllMeetingStatuses)).toBe(true);
            expect(checkUnique(AllNotificationTypes)).toBe(true);
            expect(checkUnique(AllNotificationStatuses)).toBe(true);
            expect(checkUnique(AllFormCategories)).toBe(true);
            expect(checkUnique(AllFormAnswerTypes)).toBe(true);
            expect(checkUnique(AllEnterprisePlans)).toBe(true);
            expect(checkUnique(AllCommentTargetTypes)).toBe(true);
        });
    });
});
