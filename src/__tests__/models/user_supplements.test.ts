import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import UserSupplements from '../../models/user_supplements';

describe('UserSupplements Model', () => {
  describe('Schema validation', () => {
    it('should create a user supplement with all required fields', async () => {
      const userSupplementData = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 2,
        usage: '2 capsules',
        frequency: 'daily',
        timing: 'morning',
        goals: ['energy', 'immunity'],
        startDate: new Date('2025-11-01'),
        isActive: true,
      };

      const userSupplement = await UserSupplements.create(userSupplementData);

      expect(userSupplement._id).toBeDefined();
      expect(userSupplement.userId).toEqual(userSupplementData.userId);
      expect(userSupplement.supplementId).toEqual(userSupplementData.supplementId);
      expect(userSupplement.quantity).toBe(2);
      expect(userSupplement.usage).toBe('2 capsules');
      expect(userSupplement.frequency).toBe('daily');
      expect(userSupplement.timing).toBe('morning');
      expect(userSupplement.goals).toEqual(['energy', 'immunity']);
      expect(userSupplement.startDate).toEqual(userSupplementData.startDate);
      expect(userSupplement.isActive).toBe(true);
    });

    it('should create with default timestamps', async () => {
      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 tablet',
        frequency: 'daily',
        timing: 'evening',
        goals: ['sleep'],
        startDate: new Date(),
        isActive: true,
      });

      expect(userSupplement.createdAt).toBeDefined();
      expect(userSupplement.createdAt).toBeInstanceOf(Date);
      expect(userSupplement.updatedAt).toBeDefined();
      expect(userSupplement.updatedAt).toBeInstanceOf(Date);
    });

    it('should store multiple goals', async () => {
      const goals = ['energy', 'focus', 'immunity', 'recovery'];

      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 3,
        usage: '3 pills',
        frequency: 'twice daily',
        timing: 'morning and evening',
        goals,
        startDate: new Date(),
        isActive: true,
      });

      expect(userSupplement.goals).toHaveLength(4);
      expect(userSupplement.goals).toEqual(goals);
    });
  });

  describe('Optional fields', () => {
    it('should store end date', async () => {
      const endDate = new Date('2025-12-31');

      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 capsule',
        frequency: 'daily',
        timing: 'morning',
        goals: ['health'],
        startDate: new Date('2025-01-01'),
        endDate,
        isActive: false,
      });

      expect(userSupplement.endDate).toEqual(endDate);
      expect(userSupplement.endDate).toBeInstanceOf(Date);
    });

    it('should store personal rating', async () => {
      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 2,
        usage: '2 tablets',
        frequency: 'daily',
        timing: 'afternoon',
        goals: ['energy'],
        startDate: new Date(),
        isActive: true,
        personalRating: 5,
      });

      expect(userSupplement.personalRating).toBe(5);
    });

    it('should store effectiveness rating', async () => {
      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 pill',
        frequency: 'daily',
        timing: 'evening',
        goals: ['sleep'],
        startDate: new Date(),
        isActive: true,
        effectiveness: 4,
      });

      expect(userSupplement.effectiveness).toBe(4);
    });

    it('should store notes', async () => {
      const notes = 'Taking with food helps with absorption. No side effects observed.';

      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 capsule',
        frequency: 'daily',
        timing: 'with breakfast',
        goals: ['health'],
        startDate: new Date(),
        isActive: true,
        notes,
      });

      expect(userSupplement.notes).toBe(notes);
    });

    it('should store prescribed by reference', async () => {
      const advisorId = new mongoose.Types.ObjectId();

      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 2,
        usage: '2 capsules',
        frequency: 'daily',
        timing: 'morning',
        goals: ['immunity'],
        startDate: new Date(),
        isActive: true,
        prescribedBy: advisorId,
      });

      expect(userSupplement.prescribedBy).toEqual(advisorId);
    });

    it('should store related meeting reference', async () => {
      const meetingId = new mongoose.Types.ObjectId();

      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 tablet',
        frequency: 'daily',
        timing: 'evening',
        goals: ['recovery'],
        startDate: new Date(),
        isActive: true,
        relatedMeeting: meetingId,
      });

      expect(userSupplement.relatedMeeting).toEqual(meetingId);
    });
  });

  describe('Active status', () => {
    it('should mark supplement as active', async () => {
      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 capsule',
        frequency: 'daily',
        timing: 'morning',
        goals: ['energy'],
        startDate: new Date(),
        isActive: true,
      });

      expect(userSupplement.isActive).toBe(true);
    });

    it('should mark supplement as inactive when stopped', async () => {
      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 pill',
        frequency: 'daily',
        timing: 'morning',
        goals: ['test'],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-11-01'),
        isActive: false,
      });

      expect(userSupplement.isActive).toBe(false);
      expect(userSupplement.endDate).toBeDefined();
    });

    it('should allow toggling active status', async () => {
      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 2,
        usage: '2 tablets',
        frequency: 'daily',
        timing: 'morning',
        goals: ['health'],
        startDate: new Date(),
        isActive: true,
      });

      userSupplement.isActive = false;
      userSupplement.endDate = new Date();
      await userSupplement.save();

      const updated = await UserSupplements.findById(userSupplement._id);
      expect(updated?.isActive).toBe(false);
      expect(updated?.endDate).toBeDefined();
    });
  });

  describe('Usage tracking', () => {
    it('should track different frequencies', async () => {
      const frequencies = ['daily', 'twice daily', 'weekly', 'as needed'];

      for (const frequency of frequencies) {
        const userSupplement = await UserSupplements.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          supplementId: new mongoose.Types.ObjectId(),
          quantity: 1,
          usage: '1 unit',
          frequency,
          timing: 'morning',
          goals: ['health'],
          startDate: new Date(),
          isActive: true,
        });

        expect(userSupplement.frequency).toBe(frequency);
      }
    });

    it('should track different timing schedules', async () => {
      const timings = ['morning', 'afternoon', 'evening', 'before bed', 'with meals'];

      for (const timing of timings) {
        const userSupplement = await UserSupplements.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          supplementId: new mongoose.Types.ObjectId(),
          quantity: 1,
          usage: '1 unit',
          frequency: 'daily',
          timing,
          goals: ['health'],
          startDate: new Date(),
          isActive: true,
        });

        expect(userSupplement.timing).toBe(timing);
      }
    });
  });

  describe('Query operations', () => {
    it('should find supplements by userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 capsule',
        frequency: 'daily',
        timing: 'morning',
        goals: ['energy'],
        startDate: new Date(),
        isActive: true,
      });

      const found = await UserSupplements.find({ userId });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].userId).toEqual(userId);
    });

    it('should find active supplements for a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 pill',
        frequency: 'daily',
        timing: 'morning',
        goals: ['health'],
        startDate: new Date(),
        isActive: true,
      });

      const found = await UserSupplements.find({ userId, isActive: true });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].isActive).toBe(true);
    });

    it('should find supplements by supplementId', async () => {
      const supplementId = new mongoose.Types.ObjectId();
      await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId,
        quantity: 2,
        usage: '2 capsules',
        frequency: 'daily',
        timing: 'morning',
        goals: ['immunity'],
        startDate: new Date(),
        isActive: true,
      });

      const found = await UserSupplements.find({ supplementId });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].supplementId).toEqual(supplementId);
    });

    it('should update supplement ratings', async () => {
      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        supplementId: new mongoose.Types.ObjectId(),
        quantity: 1,
        usage: '1 capsule',
        frequency: 'daily',
        timing: 'morning',
        goals: ['energy'],
        startDate: new Date(),
        isActive: true,
      });

      userSupplement.personalRating = 5;
      userSupplement.effectiveness = 4;
      userSupplement.notes = 'Works great for energy!';
      await userSupplement.save();

      const updated = await UserSupplements.findById(userSupplement._id);
      expect(updated?.personalRating).toBe(5);
      expect(updated?.effectiveness).toBe(4);
      expect(updated?.notes).toBe('Works great for energy!');
    });
  });

  describe('References', () => {
    it('should maintain references to user and supplement', async () => {
      const userId = new mongoose.Types.ObjectId();
      const supplementId = new mongoose.Types.ObjectId();

      const userSupplement = await UserSupplements.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        supplementId,
        quantity: 1,
        usage: '1 unit',
        frequency: 'daily',
        timing: 'morning',
        goals: ['health'],
        startDate: new Date(),
        isActive: true,
      });

      expect(userSupplement.userId).toEqual(userId);
      expect(userSupplement.supplementId).toEqual(supplementId);
    });
  });
});
