import { describe, it, expect } from 'vitest';
import { validateEmail } from '../../types/e-mail_format_check';

describe('Email Validator', () => {
  describe('Valid emails', () => {
    it('should accept standard email format', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should accept email with plus sign', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should accept email with dots in username', () => {
      expect(validateEmail('first.last@example.com')).toBe(true);
    });

    it('should accept email with numbers', () => {
      expect(validateEmail('user123@example.com')).toBe(true);
    });

    it('should accept email with hyphen in domain', () => {
      expect(validateEmail('user@my-domain.com')).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('should accept email with uppercase letters', () => {
      expect(validateEmail('User@Example.COM')).toBe(true);
    });

    it('should accept email with underscore', () => {
      expect(validateEmail('first_last@example.com')).toBe(true);
    });

    it('should accept email with percent sign', () => {
      expect(validateEmail('user%name@example.com')).toBe(true);
    });
  });

  describe('Invalid emails', () => {
    it('should reject empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should reject email without @ symbol', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email starting with @', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('should reject email ending with @', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('user@ example.com')).toBe(false);
    });

    it('should reject email with consecutive dots', () => {
      expect(validateEmail('user..name@example.com')).toBe(false);
    });

    it('should reject email without domain extension', () => {
      expect(validateEmail('user@example')).toBe(false);
    });

    it('should reject email with only one character domain extension', () => {
      expect(validateEmail('user@example.c')).toBe(false);
    });

    it('should reject email without dot after @', () => {
      expect(validateEmail('user@examplecom')).toBe(false);
    });

    it('should reject multiple @ symbols', () => {
      expect(validateEmail('user@@example.com')).toBe(false);
    });

    it('should reject email with special characters in domain', () => {
      expect(validateEmail('user@exam ple.com')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long valid emails', () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      expect(validateEmail(longEmail)).toBe(true);
    });

    it('should accept email with multiple subdomains', () => {
      expect(validateEmail('user@mail.corp.example.com')).toBe(true);
    });

    it('should accept minimum length domain extension', () => {
      expect(validateEmail('user@example.co')).toBe(true);
    });
  });
});
