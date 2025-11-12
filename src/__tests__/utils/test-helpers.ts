import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../../models/user';
import { UserRoleType } from '../../models/constants';

/**
 * Test kullanıcısı oluşturmak için helper fonksiyon
 */
export const createTestUser = async (overrides: any = {}) => {
  const defaultUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    password: await bcrypt.hash('TestPass123!', 10),
    role: 'user' as UserRoleType,
    isEmailVerified: true,
    isPasswordEnabled: true,
    refreshTokens: [],
    ...overrides,
  };

  return await User.create(defaultUser);
};

/**
 * Doğrulanmamış test kullanıcısı oluşturur
 */
export const createUnverifiedUser = async (overrides: any = {}) => {
  return await createTestUser({
    isEmailVerified: false,
    verificationCode: '123456',
    verificationCodeExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 saat
    ...overrides,
  });
};

/**
 * Advisor rolünde test kullanıcısı oluşturur
 */
export const createTestAdvisor = async (overrides: any = {}) => {
  return await createTestUser({
    role: 'advisor' as UserRoleType,
    advisorProfile: {
      specialization: ['nutrition', 'fitness'],
      bio: 'Experienced advisor',
      certifications: ['Certified Nutritionist'],
      experience: 5,
      averageRating: 4.5,
      totalReviews: 10,
    },
    ...overrides,
  });
};

/**
 * Random email oluşturur
 */
export const randomEmail = () => {
  return `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * Geçerli bir şifre döndürür
 */
export const validPassword = () => 'TestPass123!';

/**
 * Süresi dolmuş tarih döndürür
 */
export const expiredDate = () => new Date(Date.now() - 1000 * 60 * 60); // 1 saat önce

/**
 * Gelecek tarih döndürür
 */
export const futureDate = (hours: number = 24) => new Date(Date.now() + 1000 * 60 * 60 * hours);
