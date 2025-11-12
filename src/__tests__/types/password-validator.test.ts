import { describe, it, expect } from 'vitest';
import { validateStrongPassword } from '../../types/password_validator';

describe('Password Validator', () => {
  describe('Valid passwords', () => {
    it('should accept password with all requirements', () => {
      const errors = validateStrongPassword('Test123!@#');
      expect(errors).toHaveLength(0);
    });

    it('should accept password with minimum length and all character types', () => {
      const errors = validateStrongPassword('Pass123!');
      expect(errors).toHaveLength(0);
    });

    it('should accept password with various special characters', () => {
      expect(validateStrongPassword('Test123@')).toHaveLength(0);
      expect(validateStrongPassword('Test123#')).toHaveLength(0);
      expect(validateStrongPassword('Test123$')).toHaveLength(0);
      expect(validateStrongPassword('Test123%')).toHaveLength(0);
      expect(validateStrongPassword('Test123^')).toHaveLength(0);
      expect(validateStrongPassword('Test123&')).toHaveLength(0);
      expect(validateStrongPassword('Test123*')).toHaveLength(0);
    });

    it('should accept long complex password', () => {
      const errors = validateStrongPassword('VeryComplexPassword123!@#$%^&*()');
      expect(errors).toHaveLength(0);
    });
  });

  describe('Invalid passwords - length', () => {
    it('should reject password shorter than 8 characters', () => {
      const errors = validateStrongPassword('Test12!');
      expect(errors).toContain('Şifre en az 8 karakter uzunluğunda olmalıdır');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject very short password', () => {
      const errors = validateStrongPassword('Aa1!');
      expect(errors).toContain('Şifre en az 8 karakter uzunluğunda olmalıdır');
    });

    it('should reject empty password', () => {
      const errors = validateStrongPassword('');
      expect(errors).toContain('Şifre en az 8 karakter uzunluğunda olmalıdır');
    });
  });

  describe('Invalid passwords - missing character types', () => {
    it('should reject password without uppercase letter', () => {
      const errors = validateStrongPassword('test123!');
      expect(errors).toContain('Şifre en az bir büyük harf içermelidir');
    });

    it('should reject password without lowercase letter', () => {
      const errors = validateStrongPassword('TEST123!');
      expect(errors).toContain('Şifre en az bir küçük harf içermelidir');
    });

    it('should reject password without number', () => {
      const errors = validateStrongPassword('TestPass!');
      expect(errors).toContain('Şifre en az bir rakam içermelidir');
    });

    it('should reject password without special character', () => {
      const errors = validateStrongPassword('TestPass123');
      expect(errors).toContain('Şifre en az bir özel karakter içermelidir (!@#$%^&*()_+-=[]{};\'"\\|,.<>/?)');
    });
  });

  describe('Invalid passwords - spaces', () => {
    it('should reject password with space in middle', () => {
      const errors = validateStrongPassword('Test 123!');
      expect(errors).toContain('Şifre boşluk içeremez');
    });

    it('should reject password with space at beginning', () => {
      const errors = validateStrongPassword(' Test123!');
      expect(errors).toContain('Şifre boşluk içeremez');
    });

    it('should reject password with space at end', () => {
      const errors = validateStrongPassword('Test123! ');
      expect(errors).toContain('Şifre boşluk içeremez');
    });

    it('should reject password with multiple spaces', () => {
      const errors = validateStrongPassword('Test  123!');
      expect(errors).toContain('Şifre boşluk içeremez');
    });
  });

  describe('Multiple validation errors', () => {
    it('should return multiple errors for very weak password', () => {
      const errors = validateStrongPassword('test');
      expect(errors.length).toBeGreaterThanOrEqual(4);
      expect(errors).toContain('Şifre en az 8 karakter uzunluğunda olmalıdır');
      expect(errors).toContain('Şifre en az bir büyük harf içermelidir');
      expect(errors).toContain('Şifre en az bir rakam içermelidir');
      expect(errors).toContain('Şifre en az bir özel karakter içermelidir (!@#$%^&*()_+-=[]{};\'"\\|,.<>/?)');
    });

    it('should return all missing requirements', () => {
      const errors = validateStrongPassword('password');
      expect(errors).toContain('Şifre en az bir büyük harf içermelidir');
      expect(errors).toContain('Şifre en az bir rakam içermelidir');
      expect(errors).toContain('Şifre en az bir özel karakter içermelidir (!@#$%^&*()_+-=[]{};\'"\\|,.<>/?)');
    });

    it('should return length and space errors together', () => {
      const errors = validateStrongPassword('Test 1!');
      expect(errors).toContain('Şifre en az 8 karakter uzunluğunda olmalıdır');
      expect(errors).toContain('Şifre boşluk içeremez');
    });
  });

  describe('Edge cases', () => {
    it('should accept password with exactly 8 characters', () => {
      const errors = validateStrongPassword('Test123!');
      expect(errors).toHaveLength(0);
    });

    it('should accept password with all special characters', () => {
      const password = 'Test123!@#$%^&*()_+-=[]{};\'"\\|,.<>/?';
      const errors = validateStrongPassword(password);
      expect(errors).toHaveLength(0);
    });

    it('should handle unicode characters gracefully', () => {
      const errors = validateStrongPassword('Test123!çğış');
      expect(errors).toHaveLength(0);
    });

    it('should handle very long passwords', () => {
      const longPassword = 'Test123!' + 'a'.repeat(100);
      const errors = validateStrongPassword(longPassword);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Return value structure', () => {
    it('should return empty array for valid password', () => {
      const errors = validateStrongPassword('Test123!');
      expect(Array.isArray(errors)).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should return array of strings for invalid password', () => {
      const errors = validateStrongPassword('test');
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      errors.forEach(error => {
        expect(typeof error).toBe('string');
      });
    });
  });
});
