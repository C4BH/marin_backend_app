import { describe, it, expect, beforeEach } from 'vitest';
import { TokenService } from '../../utils/generate_token';
import jwt from 'jsonwebtoken';

describe('TokenService', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockRole = 'user';

  beforeEach(() => {
    // Environment variables are set in setup.ts
    process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-12345';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = TokenService.generateAccessToken({
        userId: mockUserId,
        role: mockRole,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include userId and role in token payload', () => {
      const token = TokenService.generateAccessToken({
        userId: mockUserId,
        role: mockRole,
      });

      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.role).toBe(mockRole);
    });

    it('should set expiry to 1 hour', () => {
      const token = TokenService.generateAccessToken({
        userId: mockUserId,
        role: mockRole,
      });

      const decoded = jwt.decode(token) as any;
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + 3600; // 1 hour

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5); // Allow 5 second margin
    });

    it('should generate different tokens for different users', () => {
      const token1 = TokenService.generateAccessToken({
        userId: mockUserId,
        role: mockRole,
      });

      const token2 = TokenService.generateAccessToken({
        userId: '507f1f77bcf86cd799439012',
        role: mockRole,
      });

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for different roles', () => {
      const token1 = TokenService.generateAccessToken({
        userId: mockUserId,
        role: 'user',
      });

      const token2 = TokenService.generateAccessToken({
        userId: mockUserId,
        role: 'advisor',
      });

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = TokenService.generateRefreshToken({
        userId: mockUserId,
        role: mockRole,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and role in token payload', () => {
      const token = TokenService.generateRefreshToken({
        userId: mockUserId,
        role: mockRole,
      });

      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.role).toBe(mockRole);
    });

    it('should set expiry to 30 days', () => {
      const token = TokenService.generateRefreshToken({
        userId: mockUserId,
        role: mockRole,
      });

      const decoded = jwt.decode(token) as any;
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + 30 * 24 * 60 * 60; // 30 days

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
    });

    it('should use different secret than access token', () => {
      const accessToken = TokenService.generateAccessToken({
        userId: mockUserId,
        role: mockRole,
      });

      const refreshToken = TokenService.generateRefreshToken({
        userId: mockUserId,
        role: mockRole,
      });

      // Access token should not verify with refresh secret and vice versa
      expect(() => {
        jwt.verify(accessToken, process.env.JWT_REFRESH_SECRET as string);
      }).toThrow();

      expect(() => {
        jwt.verify(refreshToken, process.env.JWT_SECRET as string);
      }).toThrow();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = TokenService.generateTokenPair(mockUserId, mockRole);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeDefined();
    });

    it('should return expiresIn as 3600 seconds', () => {
      const tokens = TokenService.generateTokenPair(mockUserId, mockRole);

      expect(tokens.expiresIn).toBe(3600);
    });

    it('should generate valid tokens with correct payloads', () => {
      const tokens = TokenService.generateTokenPair(mockUserId, mockRole);

      const accessDecoded = jwt.decode(tokens.accessToken) as any;
      const refreshDecoded = jwt.decode(tokens.refreshToken) as any;

      expect(accessDecoded.userId).toBe(mockUserId);
      expect(accessDecoded.role).toBe(mockRole);
      expect(refreshDecoded.userId).toBe(mockUserId);
      expect(refreshDecoded.role).toBe(mockRole);
    });

    it('should generate tokens that can be independently verified', () => {
      const tokens1 = TokenService.generateTokenPair(mockUserId, mockRole);
      const tokens2 = TokenService.generateTokenPair(mockUserId, mockRole);

      // Both tokens should be valid
      const decoded1Access = TokenService.verifyAccessToken(tokens1.accessToken);
      const decoded2Access = TokenService.verifyAccessToken(tokens2.accessToken);
      const decoded1Refresh = TokenService.verifyRefreshToken(tokens1.refreshToken);
      const decoded2Refresh = TokenService.verifyRefreshToken(tokens2.refreshToken);

      // Both should have same payload data
      expect(decoded1Access.userId).toBe(mockUserId);
      expect(decoded2Access.userId).toBe(mockUserId);
      expect(decoded1Refresh.userId).toBe(mockUserId);
      expect(decoded2Refresh.userId).toBe(mockUserId);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode valid access token', () => {
      const token = TokenService.generateAccessToken({
        userId: mockUserId,
        role: mockRole,
      });

      const decoded = TokenService.verifyAccessToken(token);

      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.role).toBe(mockRole);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        TokenService.verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for token signed with wrong secret', () => {
      const fakeToken = jwt.sign(
        { userId: mockUserId, role: mockRole },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      expect(() => {
        TokenService.verifyAccessToken(fakeToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: mockUserId, role: mockRole },
        process.env.JWT_SECRET as string,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      expect(() => {
        TokenService.verifyAccessToken(expiredToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        TokenService.verifyAccessToken('not-a-jwt-token');
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode valid refresh token', () => {
      const token = TokenService.generateRefreshToken({
        userId: mockUserId,
        role: mockRole,
      });

      const decoded = TokenService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.role).toBe(mockRole);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        TokenService.verifyRefreshToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for access token passed to refresh verify', () => {
      const accessToken = TokenService.generateAccessToken({
        userId: mockUserId,
        role: mockRole,
      });

      expect(() => {
        TokenService.verifyRefreshToken(accessToken);
      }).toThrow();
    });

    it('should throw error for expired refresh token', () => {
      const expiredToken = jwt.sign(
        { userId: mockUserId, role: mockRole },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '-1d' }
      );

      expect(() => {
        TokenService.verifyRefreshToken(expiredToken);
      }).toThrow();
    });
  });

  describe('Token integration', () => {
    it('should create, verify access token, and extract payload', () => {
      const originalPayload = { userId: mockUserId, role: 'advisor' };
      const token = TokenService.generateAccessToken(originalPayload);
      const decoded = TokenService.verifyAccessToken(token);

      expect(decoded.userId).toBe(originalPayload.userId);
      expect(decoded.role).toBe(originalPayload.role);
    });

    it('should create, verify refresh token, and extract payload', () => {
      const originalPayload = { userId: mockUserId, role: 'admin' };
      const token = TokenService.generateRefreshToken(originalPayload);
      const decoded = TokenService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(originalPayload.userId);
      expect(decoded.role).toBe(originalPayload.role);
    });

    it('should handle full token pair workflow', () => {
      const tokens = TokenService.generateTokenPair(mockUserId, 'user');

      const accessDecoded = TokenService.verifyAccessToken(tokens.accessToken);
      const refreshDecoded = TokenService.verifyRefreshToken(tokens.refreshToken);

      expect(accessDecoded.userId).toBe(mockUserId);
      expect(refreshDecoded.userId).toBe(mockUserId);
      expect(accessDecoded.role).toBe('user');
      expect(refreshDecoded.role).toBe('user');
    });
  });
});
