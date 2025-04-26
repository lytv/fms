import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as db from '../db';
import { POST } from '../route';

// Mock authentication with a more complete mock that matches route.test.ts
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({
    userId: 'user123',
    sessionClaims: {},
    sessionId: 'session123',
    actor: null,
    orgId: 'org123',
    orgRole: 'admin',
    orgSlug: 'my-org',
    has: () => true,
    organization: {},
    user: {},
  })),
}));

// Mock database operations with JSON-serializable mock data
const mockCreatedProduct = {
  id: 1,
  stt: 1,
  maHang: 'P001',
  tenHang: 'Test Product',
  ghiChu: 'Test note',
  nhomHang: 'Test category',
  vietTat: 'TP',
  nguoiThucHien: 'user123',
  ngayTao: '2025-04-26T04:44:41.625Z',
  ngayCapNhat: '2025-04-26T04:44:41.625Z',
};

vi.mock('../db', () => ({
  createProduct: vi.fn(() => Promise.resolve(mockCreatedProduct)),
  getProducts: vi.fn(() => Promise.resolve([])),
}));

// Mock console to prevent test output
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Product API Validation', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
    // Ensure auth mock is reset to return a valid userId for each test
    (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      userId: 'user123',
      sessionClaims: {},
      sessionId: 'session123',
      actor: null,
      orgId: 'org123',
      orgRole: 'admin',
      orgSlug: 'my-org',
      has: () => true,
      organization: {},
      user: {},
    });
    // Reset db mock to return the mock product
    (db.createProduct as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedProduct);
  });

  describe('POST /api/products', () => {
    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const requestBody = {
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);

      const data = await response.json();

      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
      expect(db.createProduct).not.toHaveBeenCalled();
    });

    // Test for authentication failure
    it('should return 401 if user is not authenticated', async () => {
      // Arrange - Mock auth to return null userId for this test only
      (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ userId: null });

      const requestBody = {
        maHang: 'P001',
        tenHang: 'Test Product',
      };

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);

      const data = await response.json();

      expect(data.error).toBe('Unauthorized');
      expect(db.createProduct).not.toHaveBeenCalled();
    });

    it('should return 400 if maHang is missing', async () => {
      // Arrange
      const requestBody = {
        tenHang: 'Test Product',
        // Missing maHang
      };

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);

      const data = await response.json();

      expect(data.error).toBe('Validation error');
      expect(db.createProduct).not.toHaveBeenCalled();
    });

    it('should return 400 if tenHang is missing', async () => {
      // Arrange
      const requestBody = {
        maHang: 'P001',
        // Missing tenHang
      };

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);

      const data = await response.json();

      expect(data.error).toBe('Validation error');
      expect(db.createProduct).not.toHaveBeenCalled();
    });

    it('should return 201 with valid data', async () => {
      // Arrange
      const requestBody = {
        maHang: 'P001',
        tenHang: 'Test Product',
        ghiChu: 'Test note',
        nhomHang: 'Test category',
        vietTat: 'TP',
      };

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      expect(db.createProduct).toHaveBeenCalledWith(requestBody, 'user123');
    });

    it('should create product with userId from auth', async () => {
      // Arrange
      const requestBody = {
        maHang: 'P001',
        tenHang: 'Test Product',
        ghiChu: 'Test note',
        nhomHang: 'Test category',
        vietTat: 'TP',
      };

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);

      // The key test: verify that db.createProduct was called with the auth userId (user123)
      expect(db.createProduct).toHaveBeenCalledWith(
        expect.any(Object),
        'user123',
      );
    });
  });
});
