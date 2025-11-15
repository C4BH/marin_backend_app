import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Enterprise from '../../models/enterprises';

describe('Enterprise Model', () => {
  describe('Schema validation', () => {
    it('should create an enterprise with all required fields', async () => {
      const enterpriseData = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Tech Corp',
        email: 'contact@techcorp.com',
        plan: 'bronze',
        maxUsers: 50,
        isActive: true,
        users: [],
      };

      const enterprise = await Enterprise.create(enterpriseData);

      expect(enterprise._id).toBeDefined();
      expect(enterprise.name).toBe('Tech Corp');
      expect(enterprise.email).toBe('contact@techcorp.com');
      expect(enterprise.plan).toBe('bronze');
      expect(enterprise.maxUsers).toBe(50);
      expect(enterprise.isActive).toBe(true);
      expect(enterprise.users).toEqual([]);
    });

    it('should create enterprise with default values', async () => {
      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Enterprise',
        email: 'test@enterprise.com',
        plan: 'silver',
        maxUsers: 100,
        users: [],
      });

      expect(enterprise.isActive).toBe(true);
      expect(enterprise.createdAt).toBeDefined();
      expect(enterprise.createdAt).toBeInstanceOf(Date);
      expect(enterprise.updatedAt).toBeDefined();
      expect(enterprise.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept all valid enterprise plans', async () => {
      const plans = ['bronze', 'silver', 'gold'];

      for (const plan of plans) {
        const enterprise = await Enterprise.create({
          _id: new mongoose.Types.ObjectId(),
          name: `Enterprise ${plan}`,
          email: `${plan}@test.com`,
          plan,
          maxUsers: 50,
          users: [],
        });

        expect(enterprise.plan).toBe(plan);
      }
    });
  });

  describe('Optional fields', () => {
    it('should store contact person and phone', async () => {
      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Business Inc',
        email: 'contact@business.com',
        contactPerson: 'John Smith',
        phone: '+1234567890',
        plan: 'silver',
        maxUsers: 100,
        users: [],
      });

      expect(enterprise.contactPerson).toBe('John Smith');
      expect(enterprise.phone).toBe('+1234567890');
    });

    it('should store plan features', async () => {
      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Premium Corp',
        email: 'premium@corp.com',
        plan: 'gold',
        maxUsers: 500,
        users: [],
        planFeatures: {
          meetingsPerUserPerMonth: 10,
          prioritySupport: true,
          customBranding: true,
          analyticsAccess: true,
        },
      });

      expect(enterprise.planFeatures).toBeDefined();
      expect(enterprise.planFeatures?.meetingsPerUserPerMonth).toBe(10);
      expect(enterprise.planFeatures?.prioritySupport).toBe(true);
      expect(enterprise.planFeatures?.customBranding).toBe(true);
      expect(enterprise.planFeatures?.analyticsAccess).toBe(true);
    });

    it('should use default values for plan features', async () => {
      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Basic Corp',
        email: 'basic@corp.com',
        plan: 'bronze',
        maxUsers: 25,
        users: [],
        planFeatures: {},
      });

      expect(enterprise.planFeatures?.prioritySupport).toBe(false);
      expect(enterprise.planFeatures?.customBranding).toBe(false);
      expect(enterprise.planFeatures?.analyticsAccess).toBe(false);
    });

    it('should store subscription dates', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Subscribed Corp',
        email: 'sub@corp.com',
        plan: 'silver',
        maxUsers: 75,
        users: [],
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      });

      expect(enterprise.subscriptionStartDate).toEqual(startDate);
      expect(enterprise.subscriptionEndDate).toEqual(endDate);
    });
  });

  describe('Relationships', () => {
    it('should store references to users', async () => {
      const user1 = new mongoose.Types.ObjectId();
      const user2 = new mongoose.Types.ObjectId();
      const user3 = new mongoose.Types.ObjectId();

      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'User Corp',
        email: 'users@corp.com',
        plan: 'silver',
        maxUsers: 100,
        users: [user1, user2, user3],
      });

      expect(enterprise.users).toHaveLength(3);
      expect(enterprise.users).toContainEqual(user1);
      expect(enterprise.users).toContainEqual(user2);
      expect(enterprise.users).toContainEqual(user3);
    });

    it('should store references to comments', async () => {
      const comment1 = new mongoose.Types.ObjectId();
      const comment2 = new mongoose.Types.ObjectId();

      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Comment Corp',
        email: 'comments@corp.com',
        plan: 'gold',
        maxUsers: 200,
        users: [],
        comments: [comment1, comment2],
      });

      expect(enterprise.comments).toHaveLength(2);
      expect(enterprise.comments).toContainEqual(comment1);
      expect(enterprise.comments).toContainEqual(comment2);
    });

    it('should store references to supplements', async () => {
      const supplement1 = new mongoose.Types.ObjectId();
      const supplement2 = new mongoose.Types.ObjectId();

      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Supplement Corp',
        email: 'supps@corp.com',
        plan: 'silver',
        maxUsers: 150,
        users: [],
        supplements: [supplement1, supplement2],
      });

      expect(enterprise.supplements).toHaveLength(2);
      expect(enterprise.supplements).toContainEqual(supplement1);
    });

    it('should store references to meetings', async () => {
      const meeting1 = new mongoose.Types.ObjectId();
      const meeting2 = new mongoose.Types.ObjectId();
      const meeting3 = new mongoose.Types.ObjectId();

      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Meeting Corp',
        email: 'meetings@corp.com',
        plan: 'gold',
        maxUsers: 300,
        users: [],
        meetings: [meeting1, meeting2, meeting3],
      });

      expect(enterprise.meetings).toHaveLength(3);
      expect(enterprise.meetings).toContainEqual(meeting1);
    });

    it('should store references to advisors', async () => {
      const advisor1 = new mongoose.Types.ObjectId();
      const advisor2 = new mongoose.Types.ObjectId();

      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Advisor Corp',
        email: 'advisors@corp.com',
        plan: 'gold',
        maxUsers: 250,
        users: [],
        advisors: [advisor1, advisor2],
      });

      expect(enterprise.advisors).toHaveLength(2);
      expect(enterprise.advisors).toContainEqual(advisor1);
      expect(enterprise.advisors).toContainEqual(advisor2);
    });
  });

  describe('Active status', () => {
    it('should create active enterprise by default', async () => {
      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Active Corp',
        email: 'active@corp.com',
        plan: 'bronze',
        maxUsers: 50,
        users: [],
      });

      expect(enterprise.isActive).toBe(true);
    });

    it('should allow creating inactive enterprise', async () => {
      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Inactive Corp',
        email: 'inactive@corp.com',
        plan: 'bronze',
        maxUsers: 50,
        users: [],
        isActive: false,
      });

      expect(enterprise.isActive).toBe(false);
    });

    it('should allow toggling active status', async () => {
      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Toggle Corp',
        email: 'toggle@corp.com',
        plan: 'silver',
        maxUsers: 75,
        users: [],
        isActive: true,
      });

      enterprise.isActive = false;
      await enterprise.save();

      const updated = await Enterprise.findById(enterprise._id);
      expect(updated?.isActive).toBe(false);
    });
  });

  describe('Query operations', () => {
    it('should find enterprise by email', async () => {
      const email = 'unique@enterprise.com';
      await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Unique Enterprise',
        email,
        plan: 'silver',
        maxUsers: 100,
        users: [],
      });

      const found = await Enterprise.findOne({ email });

      expect(found).toBeDefined();
      expect(found?.email).toBe(email);
    });

    it('should find enterprises by plan', async () => {
      await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Pro Enterprise 1',
        email: 'pro1@test.com',
        plan: 'silver',
        maxUsers: 100,
        users: [],
      });

      const found = await Enterprise.find({ plan: 'silver' });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].plan).toBe('silver');
    });

    it('should find active enterprises', async () => {
      await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Active Test',
        email: 'activetest@corp.com',
        plan: 'bronze',
        maxUsers: 50,
        users: [],
        isActive: true,
      });

      const found = await Enterprise.find({ isActive: true });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].isActive).toBe(true);
    });

    it('should update enterprise fields', async () => {
      const enterprise = await Enterprise.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Old Name',
        email: 'old@corp.com',
        plan: 'bronze',
        maxUsers: 50,
        users: [],
      });

      enterprise.name = 'New Name';
      enterprise.plan = 'silver';
      enterprise.maxUsers = 100;
      await enterprise.save();

      const updated = await Enterprise.findById(enterprise._id);
      expect(updated?.name).toBe('New Name');
      expect(updated?.plan).toBe('silver');
      expect(updated?.maxUsers).toBe(100);
    });
  });
});
