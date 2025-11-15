import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Meeting from '../../models/meetings';

describe('Meeting Model', () => {
  describe('Schema validation', () => {
    it('should create a meeting with all required fields', async () => {
      const meetingData = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Initial Consultation',
        description: 'First meeting to discuss health goals',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date('2025-12-01T10:00:00Z'),
        duration: 60,
        status: 'scheduled',
      };

      const meeting = await Meeting.create(meetingData);

      expect(meeting._id).toBeDefined();
      expect(meeting.title).toBe('Initial Consultation');
      expect(meeting.description).toBe('First meeting to discuss health goals');
      expect(meeting.user).toEqual(meetingData.user);
      expect(meeting.advisor).toEqual(meetingData.advisor);
      expect(meeting.scheduledTime).toEqual(meetingData.scheduledTime);
      expect(meeting.duration).toBe(60);
      expect(meeting.status).toBe('scheduled');
    });

    it('should create meeting with default timestamps', async () => {
      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Meeting',
        description: 'Test description',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 30,
        status: 'scheduled',
      });

      expect(meeting.createdAt).toBeDefined();
      expect(meeting.createdAt).toBeInstanceOf(Date);
      expect(meeting.updatedAt).toBeDefined();
      expect(meeting.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept all valid meeting statuses', async () => {
      const statuses = ['scheduled', 'completed', 'cancelled', 'no_show'];

      for (const status of statuses) {
        const meeting = await Meeting.create({
          _id: new mongoose.Types.ObjectId(),
          title: `Meeting ${status}`,
          description: 'Test',
          user: new mongoose.Types.ObjectId(),
          advisor: new mongoose.Types.ObjectId(),
          scheduledTime: new Date(),
          duration: 30,
          status,
        });

        expect(meeting.status).toBe(status);
      }
    });
  });

  describe('Optional fields', () => {
    it('should store user and advisor ratings', async () => {
      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Completed Meeting',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 45,
        status: 'completed',
        userRating: 5,
        advisorRating: 4,
        userRatingNote: 'Great session!',
        advisorRatingNote: 'Good progress',
      });

      expect(meeting.userRating).toBe(5);
      expect(meeting.advisorRating).toBe(4);
      expect(meeting.userRatingNote).toBe('Great session!');
      expect(meeting.advisorRatingNote).toBe('Good progress');
    });

    it('should store advisor notes', async () => {
      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Meeting with Notes',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 60,
        status: 'completed',
        advisorNotes: 'Patient shows improvement in energy levels',
      });

      expect(meeting.advisorNotes).toBe('Patient shows improvement in energy levels');
    });

    it('should store discussed supplements and recommendations', async () => {
      const supplement1 = new mongoose.Types.ObjectId();
      const supplement2 = new mongoose.Types.ObjectId();
      const supplement3 = new mongoose.Types.ObjectId();

      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Supplement Review',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 30,
        status: 'completed',
        discussedSupplements: [supplement1, supplement2],
        recommendations: [supplement2, supplement3],
      });

      expect(meeting.discussedSupplements).toHaveLength(2);
      expect(meeting.discussedSupplements).toContainEqual(supplement1);
      expect(meeting.discussedSupplements).toContainEqual(supplement2);
      expect(meeting.recommendations).toHaveLength(2);
      expect(meeting.recommendations).toContainEqual(supplement2);
      expect(meeting.recommendations).toContainEqual(supplement3);
    });

    it('should store cancellation information', async () => {
      const userId = new mongoose.Types.ObjectId();
      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Cancelled Meeting',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 30,
        status: 'cancelled',
        cancelledBy: userId,
        cancellationReason: 'Schedule conflict',
      });

      expect(meeting.cancelledBy).toEqual(userId);
      expect(meeting.cancellationReason).toBe('Schedule conflict');
    });

    it('should store completedAt timestamp', async () => {
      const completedDate = new Date('2025-11-15T11:00:00Z');
      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Completed Meeting',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date('2025-11-15T10:00:00Z'),
        duration: 60,
        status: 'completed',
        completedAt: completedDate,
      });

      expect(meeting.completedAt).toEqual(completedDate);
      expect(meeting.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('References', () => {
    it('should maintain reference to user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Meeting',
        description: 'Test',
        user: userId,
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 30,
        status: 'scheduled',
      });

      expect(meeting.user).toEqual(userId);
    });

    it('should maintain reference to advisor', async () => {
      const advisorId = new mongoose.Types.ObjectId();
      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Meeting',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: advisorId,
        scheduledTime: new Date(),
        duration: 30,
        status: 'scheduled',
      });

      expect(meeting.advisor).toEqual(advisorId);
    });
  });

  describe('Query operations', () => {
    it('should find meetings by user', async () => {
      const userId = new mongoose.Types.ObjectId();
      await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'User Meeting 1',
        description: 'Test',
        user: userId,
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 30,
        status: 'scheduled',
      });

      const found = await Meeting.find({ user: userId });

      expect(found).toHaveLength(1);
      expect(found[0].user).toEqual(userId);
    });

    it('should find meetings by advisor', async () => {
      const advisorId = new mongoose.Types.ObjectId();
      await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Advisor Meeting 1',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: advisorId,
        scheduledTime: new Date(),
        duration: 30,
        status: 'scheduled',
      });

      const found = await Meeting.find({ advisor: advisorId });

      expect(found).toHaveLength(1);
      expect(found[0].advisor).toEqual(advisorId);
    });

    it('should find meetings by status', async () => {
      await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Scheduled Meeting',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 30,
        status: 'scheduled',
      });

      const found = await Meeting.find({ status: 'scheduled' });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].status).toBe('scheduled');
    });

    it('should update meeting status', async () => {
      const meeting = await Meeting.create({
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Meeting',
        description: 'Test',
        user: new mongoose.Types.ObjectId(),
        advisor: new mongoose.Types.ObjectId(),
        scheduledTime: new Date(),
        duration: 30,
        status: 'scheduled',
      });

      meeting.status = 'completed';
      meeting.completedAt = new Date();
      await meeting.save();

      const updated = await Meeting.findById(meeting._id);
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
    });
  });
});
