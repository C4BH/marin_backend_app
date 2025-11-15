import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Notification from '../../models/notification';

describe('Notification Model', () => {
  describe('Schema validation', () => {
    it('should create a notification with all required fields', async () => {
      const notificationData = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'supplement_reminder',
        title: 'Time to take your supplements',
        body: 'Remember to take your vitamin D supplement',
        status: 'pending',
      };

      const notification = await Notification.create(notificationData);

      expect(notification._id).toBeDefined();
      expect(notification.userId).toEqual(notificationData.userId);
      expect(notification.type).toBe('supplement_reminder');
      expect(notification.title).toBe('Time to take your supplements');
      expect(notification.body).toBe('Remember to take your vitamin D supplement');
      expect(notification.status).toBe('pending');
    });

    it('should create notification with default createdAt', async () => {
      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'meeting_reminder',
        title: 'Meeting reminder',
        body: 'Your meeting starts in 1 hour',
        status: 'pending',
      });

      expect(notification.createdAt).toBeDefined();
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    it('should accept all valid notification types', async () => {
      const types = ['supplement_reminder', 'meeting_reminder', 'form_due', 'meeting_request'];

      for (const type of types) {
        const notification = await Notification.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          type,
          title: `${type} notification`,
          body: 'Test notification',
          status: 'pending',
        });

        expect(notification.type).toBe(type);
      }
    });

    it('should accept all valid notification statuses', async () => {
      const statuses = ['pending', 'sent', 'read', 'failed'];

      for (const status of statuses) {
        const notification = await Notification.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          type: 'meeting_request',
          title: 'Test notification',
          body: 'Test body',
          status,
        });

        expect(notification.status).toBe(status);
      }
    });
  });

  describe('Optional fields', () => {
    it('should store scheduled time', async () => {
      const scheduledDate = new Date('2025-12-01T10:00:00Z');

      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'supplement_reminder',
        title: 'Scheduled reminder',
        body: 'Take your supplements',
        status: 'pending',
        scheduledFor: scheduledDate,
      });

      expect(notification.scheduledFor).toEqual(scheduledDate);
      expect(notification.scheduledFor).toBeInstanceOf(Date);
    });

    it('should store sentAt timestamp', async () => {
      const sentDate = new Date('2025-11-15T10:00:00Z');

      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'meeting_reminder',
        title: 'Meeting reminder',
        body: 'Your meeting starts soon',
        status: 'sent',
        sentAt: sentDate,
      });

      expect(notification.sentAt).toEqual(sentDate);
      expect(notification.sentAt).toBeInstanceOf(Date);
    });

    it('should store readAt timestamp', async () => {
      const readDate = new Date('2025-11-15T11:00:00Z');

      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'meeting_request',
        title: 'System update',
        body: 'New features available',
        status: 'read',
        readAt: readDate,
      });

      expect(notification.readAt).toEqual(readDate);
      expect(notification.readAt).toBeInstanceOf(Date);
    });

    it('should store related entity information', async () => {
      const supplementId = new mongoose.Types.ObjectId();

      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'supplement_reminder',
        title: 'Supplement reminder',
        body: 'Time to take your supplement',
        status: 'pending',
        relatedEntity: {
          type: 'supplement_reminder',
          id: supplementId,
        },
      });

      expect(notification.relatedEntity).toBeDefined();
      expect(notification.relatedEntity?.type).toBe('supplement');
      expect(notification.relatedEntity?.id).toEqual(supplementId);
    });

    it('should store meeting related entity', async () => {
      const meetingId = new mongoose.Types.ObjectId();

      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'meeting_reminder',
        title: 'Meeting reminder',
        body: 'Your meeting is about to start',
        status: 'pending',
        relatedEntity: {
          type: 'meeting_reminder',
          id: meetingId,
        },
      });

      expect(notification.relatedEntity?.type).toBe('meeting');
      expect(notification.relatedEntity?.id).toEqual(meetingId);
    });

    it('should store form related entity', async () => {
      const formId = new mongoose.Types.ObjectId();

      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'form_due',
        title: 'Form reminder',
        body: 'Please complete your health form',
        status: 'pending',
        relatedEntity: {
          type: 'form_due',
          id: formId,
        },
      });

      expect(notification.relatedEntity?.type).toBe('form');
      expect(notification.relatedEntity?.id).toEqual(formId);
    });
  });

  describe('Notification lifecycle', () => {
    it('should transition from pending to sent', async () => {
      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'supplement_reminder',
        title: 'Test notification',
        body: 'Test body',
        status: 'pending',
      });

      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();

      const updated = await Notification.findById(notification._id);
      expect(updated?.status).toBe('sent');
      expect(updated?.sentAt).toBeDefined();
    });

    it('should transition from sent to read', async () => {
      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'meeting_reminder',
        title: 'Test notification',
        body: 'Test body',
        status: 'sent',
        sentAt: new Date(),
      });

      notification.status = 'read';
      notification.readAt = new Date();
      await notification.save();

      const updated = await Notification.findById(notification._id);
      expect(updated?.status).toBe('read');
      expect(updated?.readAt).toBeDefined();
    });

    it('should mark notification as failed', async () => {
      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'meeting_request',
        title: 'Test notification',
        body: 'Test body',
        status: 'pending',
      });

      notification.status = 'failed';
      await notification.save();

      const updated = await Notification.findById(notification._id);
      expect(updated?.status).toBe('failed');
    });
  });

  describe('Query operations', () => {
    it('should find notifications by userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        type: 'supplement_reminder',
        title: 'User notification 1',
        body: 'Test',
        status: 'pending',
      });

      const found = await Notification.find({ userId });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].userId).toEqual(userId);
    });

    it('should find notifications by status', async () => {
      await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'meeting_reminder',
        title: 'Pending notification',
        body: 'Test',
        status: 'pending',
      });

      const found = await Notification.find({ status: 'pending' });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].status).toBe('pending');
    });

    it('should find notifications by type', async () => {
      await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'supplement_reminder',
        title: 'Supplement notification',
        body: 'Test',
        status: 'pending',
      });

      const found = await Notification.find({ type: 'supplement_reminder' });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].type).toBe('supplement_reminder');
    });

    it('should find unread notifications for a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        type: 'meeting_request',
        title: 'Unread notification',
        body: 'Test',
        status: 'sent',
      });

      const found = await Notification.find({
        userId,
        status: { $in: ['pending', 'sent'] },
      });

      expect(found.length).toBeGreaterThan(0);
    });

    it('should find scheduled notifications due for sending', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

      await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        type: 'supplement_reminder',
        title: 'Due notification',
        body: 'Test',
        status: 'pending',
        scheduledFor: pastDate,
      });

      const found = await Notification.find({
        status: 'pending',
        scheduledFor: { $lte: new Date() },
      });

      expect(found.length).toBeGreaterThan(0);
    });
  });

  describe('References', () => {
    it('should maintain reference to user', async () => {
      const userId = new mongoose.Types.ObjectId();

      const notification = await Notification.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        type: 'meeting_request',
        title: 'Test',
        body: 'Test body',
        status: 'pending',
      });

      expect(notification.userId).toEqual(userId);
    });
  });
});
