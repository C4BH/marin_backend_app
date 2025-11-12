import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import User from '../../models/user';
import bcrypt from 'bcrypt';

describe('User Model', () => {
  describe('Schema validation', () => {
    it('should create a user with all required fields', async () => {
      const userData = {
        _id: new mongoose.Types.ObjectId(),
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        isEmailVerified: false,
        isPasswordEnabled: true,
      };

      const user = await User.create(userData);

      expect(user._id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe('user');
      expect(user.isEmailVerified).toBe(false);
      expect(user.isPasswordEnabled).toBe(true);
    });

    it('should create user with default values', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: false,
        isPasswordEnabled: false,
      });

      expect(user.refreshTokens).toEqual([]);
      expect(user.createdAt).toBeDefined();
    });

    it('should accept advisor role', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Advisor User',
        email: 'advisor@example.com',
        role: 'advisor',
        isEmailVerified: true,
        isPasswordEnabled: true,
        advisorProfile: {
          specialization: ['nutrition', 'fitness'],
          bio: 'Experienced advisor',
          certifications: ['Cert1'],
          experience: 5,
          averageRating: 4.5,
          totalReviews: 10,
        },
      });

      expect(user.role).toBe('advisor');
      expect(user.advisorProfile).toBeDefined();
      expect(user.advisorProfile?.specialization).toContain('nutrition');
    });

    it('should accept admin role', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        isEmailVerified: true,
        isPasswordEnabled: true,
      });

      expect(user.role).toBe('admin');
    });
  });

  describe('Email verification', () => {
    it('should store verification code and expiry', async () => {
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: false,
        isPasswordEnabled: false,
        verificationCode: '123456',
        verificationCodeExpires: expiresAt,
      });

      expect(user.verificationCode).toBe('123456');
      expect(user.verificationCodeExpires).toBeInstanceOf(Date);
    });

    it('should allow clearing verification code', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: false,
        isPasswordEnabled: false,
        verificationCode: '123456',
      });

      user.verificationCode = undefined;
      await user.save();

      expect(user.verificationCode).toBeUndefined();
    });
  });

  describe('Refresh tokens', () => {
    it('should store refresh tokens array', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
        refreshTokens: [
          {
            token: 'token123',
            device: 'iPhone',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          },
        ],
      });

      expect(user.refreshTokens).toHaveLength(1);
      expect(user.refreshTokens[0].token).toBe('token123');
      expect(user.refreshTokens[0].device).toBe('iPhone');
      expect(user.refreshTokens[0].expiresAt).toBeInstanceOf(Date);
    });

    it('should allow multiple refresh tokens', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
      });

      user.refreshTokens.push({
        token: 'token1',
        device: 'iPhone',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      });
      user.refreshTokens.push({
        token: 'token2',
        device: 'Android',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      });

      await user.save();

      expect(user.refreshTokens).toHaveLength(2);
      expect(user.refreshTokens[0].device).toBe('iPhone');
      expect(user.refreshTokens[1].device).toBe('Android');
    });

    it('should allow removing refresh tokens', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
        refreshTokens: [
          {
            token: 'token1',
            device: 'iPhone',
            expiresAt: new Date(),
          },
          {
            token: 'token2',
            device: 'Android',
            expiresAt: new Date(),
          },
        ],
      });

      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== 'token1');
      await user.save();

      expect(user.refreshTokens).toHaveLength(1);
      expect(user.refreshTokens[0].token).toBe('token2');
    });
  });

  describe('Password handling', () => {
    it('should store hashed password', async () => {
      const plainPassword = 'MySecurePassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        password: hashedPassword,
        isEmailVerified: true,
        isPasswordEnabled: true,
      });

      expect(user.password).toBeDefined();
      expect(user.password).not.toBe(plainPassword);
      expect(await bcrypt.compare(plainPassword, user.password!)).toBe(true);
    });

    it('should allow password to be optional', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Social User',
        email: 'social@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: false,
      });

      expect(user.password).toBeUndefined();
    });
  });

  describe('Advisor profile', () => {
    it('should store advisor profile for advisor role', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Advisor',
        email: 'advisor@example.com',
        role: 'advisor',
        isEmailVerified: true,
        isPasswordEnabled: true,
        advisorProfile: {
          specialization: ['nutrition', 'weight-loss', 'sports'],
          bio: 'Certified nutritionist with 10 years experience',
          certifications: ['RD', 'CSCS', 'CISSN'],
          experience: 10,
          averageRating: 4.8,
          totalReviews: 150,
        },
      });

      expect(user.advisorProfile).toBeDefined();
      expect(user.advisorProfile?.specialization).toHaveLength(3);
      expect(user.advisorProfile?.certifications).toHaveLength(3);
      expect(user.advisorProfile?.experience).toBe(10);
      expect(user.advisorProfile?.averageRating).toBe(4.8);
      expect(user.advisorProfile?.totalReviews).toBe(150);
    });

    it('should have default advisor profile for advisors', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'New Advisor',
        email: 'newadvisor@example.com',
        role: 'advisor',
        isEmailVerified: true,
        isPasswordEnabled: true,
      });

      expect(user.advisorProfile).toBeDefined();
      expect(user.advisorProfile?.specialization).toEqual([]);
      expect(user.advisorProfile?.bio).toBe('');
      expect(user.advisorProfile?.certifications).toEqual([]);
      expect(user.advisorProfile?.experience).toBe(0);
      expect(user.advisorProfile?.averageRating).toBe(0);
      expect(user.advisorProfile?.totalReviews).toBe(0);
    });
  });

  describe('Relationships', () => {
    it('should store references to meetings', async () => {
      const meetingId = new mongoose.Types.ObjectId();
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
        meetings: [meetingId],
      });

      expect(user.meetings).toHaveLength(1);
      expect(user.meetings?.[0]).toEqual(meetingId);
    });

    it('should store references to supplements', async () => {
      const supplementId = new mongoose.Types.ObjectId();
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
        supplements: [supplementId],
      });

      expect(user.supplements).toHaveLength(1);
      expect(user.supplements?.[0]).toEqual(supplementId);
    });

    it('should store references to comments', async () => {
      const commentId = new mongoose.Types.ObjectId();
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
        comments: [commentId],
      });

      expect(user.comments).toHaveLength(1);
      expect(user.comments?.[0]).toEqual(commentId);
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt automatically', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: false,
        isPasswordEnabled: false,
      });

      expect(user.createdAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should allow setting lastLoginAt', async () => {
      const loginDate = new Date();
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
        lastLoginAt: loginDate,
      });

      expect(user.lastLoginAt).toBeDefined();
      expect(user.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('Query operations', () => {
    it('should find user by email', async () => {
      await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Find Me',
        email: 'findme@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
      });

      const found = await User.findOne({ email: 'findme@example.com' });

      expect(found).toBeDefined();
      expect(found?.email).toBe('findme@example.com');
    });

    it('should find user by refresh token', async () => {
      const refreshToken = 'unique-refresh-token-123';
      await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: true,
        isPasswordEnabled: true,
        refreshTokens: [
          {
            token: refreshToken,
            device: 'iPhone',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          },
        ],
      });

      const found = await User.findOne({ 'refreshTokens.token': refreshToken });

      expect(found).toBeDefined();
      expect(found?.refreshTokens[0].token).toBe(refreshToken);
    });

    it('should update user fields', async () => {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: 'Old Name',
        email: 'test@example.com',
        role: 'user',
        isEmailVerified: false,
        isPasswordEnabled: false,
      });

      user.name = 'New Name';
      user.isEmailVerified = true;
      await user.save();

      const updated = await User.findById(user._id);
      expect(updated?.name).toBe('New Name');
      expect(updated?.isEmailVerified).toBe(true);
    });
  });
});
