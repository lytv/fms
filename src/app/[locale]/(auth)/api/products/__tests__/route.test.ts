// Create mocks before importing any modules
// Import after mocking
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as db from '../db';
import { GET, POST } from '../route';

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

// Create JSON serializable mock data
const dateStr = '2025-04-26T04:44:41.625Z';
const mockProducts = {
  products: [
    {
      id: 1,
      stt: 1,
      maHang: 'P001',
      tenHang: 'Product 1',
      ghiChu: 'Test notes',
      nhomHang: 'Test category',
      vietTat: 'P1',
      nguoiThucHien: 'user123',
      ngayTao: dateStr,
      ngayCapNhat: dateStr,
    },
    {
      id: 2,
      stt: 2,
      maHang: 'P002',
      tenHang: 'Product 2',
      ghiChu: 'Test notes 2',
      nhomHang: 'Test category 2',
      vietTat: 'P2',
      nguoiThucHien: 'user123',
      ngayTao: dateStr,
      ngayCapNhat: dateStr,
    },
  ],
  page: 1,
  limit: 10,
  totalPages: 1,
};

const mockCreatedProduct = {
  id: 3,
  stt: 3,
  maHang: 'P003',
  tenHang: 'New Product',
  ghiChu: 'Test notes',
  nhomHang: 'Test category',
  vietTat: 'NP',
  nguoiThucHien: 'user123',
  ngayTao: dateStr,
  ngayCapNhat: dateStr,
};

// Mock database operations
vi.mock('../db', () => ({
  getProducts: vi.fn(() => Promise.resolve([])),
  createProduct: vi.fn(() => Promise.resolve(null)),
}));

// Mock console to prevent test failures due to console output
const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});

describe('Products API', () => {
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
    // Reset db mocks with proper return values
    (db.getProducts as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(mockProducts));
    (db.createProduct as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(mockCreatedProduct));
  });

  describe('GET /api/products', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/products');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(401);

      const data = await response.json();

      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return products when authenticated', async () => {
      // Act
      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data).toEqual(mockProducts);
      expect(db.getProducts).toHaveBeenCalledWith(1, 10, 'user123');
    });

    it('should pass query parameters to getProducts', async () => {
      // Arrange - Use the proper search URL format with page/limit
      const searchRequest = new NextRequest('http://localhost:3000/api/products?page=2&limit=20');

      // Act
      const searchResponse = await GET(searchRequest);

      // Assert
      expect(searchResponse.status).toBe(200);

      const searchData = await searchResponse.json();

      expect(searchData).toEqual(mockProducts);
      expect(db.getProducts).toHaveBeenCalledWith(2, 20, 'user123');
    });

    it('should handle server errors', async () => {
      // Arrange
      // Temporarily unmock console.error to allow it to be called during error test
      console.error = vi.fn();

      (db.getProducts as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const errorRequest = new NextRequest('http://localhost:3000/api/products');

      // Act
      const errorResponse = await GET(errorRequest);

      // Assert
      expect(errorResponse.status).toBe(500);

      const errorData = await errorResponse.json();

      expect(errorData).toEqual({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalled();

      // Restore the general mock
      console.error = originalConsoleError;
    });
  });

  describe('POST /api/products', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);

      const data = await response.json();

      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should create a product when authenticated with valid data', async () => {
      // Arrange
      const newProduct = {
        maHang: 'P003',
        tenHang: 'New Product',
        ghiChu: 'Test notes',
        nhomHang: 'Test category',
        vietTat: 'NP',
      };

      const createRequest = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      // Act
      const createResponse = await POST(createRequest);

      // Assert
      expect(createResponse.status).toBe(201);

      const createResponseData = await createResponse.json();

      expect(createResponseData).toEqual(mockCreatedProduct);
      expect(db.createProduct).toHaveBeenCalledWith(newProduct, 'user123');
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const invalidProduct = {
        // Missing required fields
        maHang: 'P003',
      };

      const invalidRequest = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidProduct),
      });

      // Act
      const invalidResponse = await POST(invalidRequest);

      // Assert
      expect(invalidResponse.status).toBe(400);

      const invalidData = await invalidResponse.json();

      expect(invalidData.error).toBe('Validation error');
    });

    it('should handle server errors', async () => {
      // Arrange
      // Temporarily unmock console.error to allow it to be called during error test
      console.error = vi.fn();

      (db.createProduct as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const validProduct = {
        maHang: 'P003',
        tenHang: 'New Product',
      };

      const errorRequest = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validProduct),
      });

      // Act
      const errorResponse = await POST(errorRequest);

      // Assert
      expect(errorResponse.status).toBe(500);

      const errorData = await errorResponse.json();

      expect(errorData).toEqual({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalled();

      // Restore the general mock
      console.error = originalConsoleError;
    });
  });
});
