import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('API Response Format', () => {
    it('should have consistent success response structure', () => {
      const successResponse = {
        success: true,
        data: { id: '123', name: 'Test' },
        message: 'Operation completed',
      };
      
      expect(successResponse).toHaveProperty('success');
      expect(successResponse.success).toBe(true);
      expect(successResponse).toHaveProperty('data');
    });

    it('should have consistent error response structure', () => {
      const errorResponse = {
        success: false,
        error: 'Invalid request',
        code: 'INVALID_REQUEST',
      };
      
      expect(errorResponse).toHaveProperty('success');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse).toHaveProperty('error');
    });
  });

  describe('Request Validation', () => {
    it('should validate required fields', () => {
      const validateRequired = (obj: Record<string, unknown>, fields: string[]) => {
        for (const field of fields) {
          if (!obj[field]) {
            return { valid: false, field };
          }
        }
        return { valid: true };
      };

      expect(validateRequired({ userId: '123' }, ['userId'])).toEqual({ valid: true });
      expect(validateRequired({}, ['userId'])).toEqual({ valid: false, field: 'userId' });
    });

    it('should validate email format', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
    });

    it('should validate phone number format', () => {
      const isValidPhone = (phone: string) => {
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        return phoneRegex.test(phone.replace(/[\s-]/g, ''));
      };

      expect(isValidPhone('+919876543210')).toBe(true);
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables', () => {
      const getRequiredEnv = (key: string) => {
        const value = process.env[key];
        if (!value) {
          throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
      };

      const originalValue = process.env.NEXT_PUBLIC_TEST_VAR;
      delete process.env.NEXT_PUBLIC_TEST_VAR;
      expect(() => getRequiredEnv('NEXT_PUBLIC_TEST_VAR')).toThrow();
      if (originalValue) process.env.NEXT_PUBLIC_TEST_VAR = originalValue;
    });

    it('should handle network errors gracefully', () => {
      const handleNetworkError = (error: unknown) => {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          return { error: 'Network error', retry: true };
        }
        if (error instanceof Error) {
          return { error: error.message, retry: false };
        }
        return { error: 'Unknown error', retry: false };
      };

      expect(handleNetworkError(new TypeError('Failed to fetch'))).toEqual({
        error: 'Network error',
        retry: true,
      });
      expect(handleNetworkError(new Error('Custom error'))).toEqual({
        error: 'Custom error',
        retry: false,
      });
    });
  });

  describe('Pagination', () => {
    it('should calculate pagination correctly', () => {
      const calculatePagination = (page: number, limit: number) => {
        const offset = (page - 1) * limit;
        return { offset, limit, page };
      };

      expect(calculatePagination(1, 10)).toEqual({ offset: 0, limit: 10, page: 1 });
      expect(calculatePagination(2, 10)).toEqual({ offset: 10, limit: 10, page: 2 });
      expect(calculatePagination(5, 20)).toEqual({ offset: 80, limit: 20, page: 5 });
    });

    it('should generate pagination metadata', () => {
      const getPaginationMeta = (total: number, page: number, limit: number) => {
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        return { total, page, limit, totalPages, hasNext, hasPrev };
      };

      expect(getPaginationMeta(50, 1, 10)).toEqual({
        total: 50, page: 1, limit: 10, totalPages: 5, hasNext: true, hasPrev: false
      });
      expect(getPaginationMeta(50, 5, 10)).toEqual({
        total: 50, page: 5, limit: 10, totalPages: 5, hasNext: false, hasPrev: true
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should track request timestamps correctly', () => {
      const checkRateLimit = (timestamps: number[], windowMs: number, maxRequests: number) => {
        const now = Date.now();
        const recent = timestamps.filter(t => now - t < windowMs);
        return recent.length < maxRequests;
      };

      const now = Date.now();
      expect(checkRateLimit([now - 1000], 60000, 5)).toBe(true);
      expect(checkRateLimit([now - 1000, now - 2000, now - 3000, now - 4000, now - 5000], 60000, 5)).toBe(false);
    });
  });
});