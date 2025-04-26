// Create mocks before importing any modules
// Import after mocking
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE, GET, PUT } from '../[id]/route';
import * as db from '../db';

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

// Mock database operations
vi.mock('../db', () => ({
  getProductById: vi.fn(() => Promise.resolve(null)),
  updateProduct: vi.fn(() => Promise.resolve(null)),
  deleteProduct: vi.fn(() => Promise.resolve(true)),
}));

// Store original console.error for testing
const originalConsoleError = console.error;

// Mock console.error to prevent test output
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Product API [id]', () => {
  const productId = '1';
  const dateNow = new Date();

  const mockProduct = {
    id: 1,
    stt: 1,
    maHang: 'P001',
    tenHang: 'Product 1',
    ghiChu: 'Test notes',
    nhomHang: 'Test category',
    vietTat: 'P1',
    nguoiThucHien: 'user123',
    ngayTao: dateNow,
    ngayCapNhat: dateNow,
  };

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
    (db.getProductById as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(null));
    (db.updateProduct as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(null));
    (db.deleteProduct as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(true));
  });

  describe('GET /api/products/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ userId: null });

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`);

      // Act
      const response = await GET(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(401);

      const data = await response.json();

      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return product when authenticated', async () => {
      // Arrange
      // Use string dates in the mock to match what will be returned in the JSON response
      const dateStr = '2025-04-26T04:44:41.625Z';
      const mockProduct = {
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
      };

      (db.getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`);

      // Act
      const response = await GET(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data).toEqual(mockProduct);
      expect(db.getProductById).toHaveBeenCalledWith(productId, 'user123');
    });

    it('should return 404 when product is not found', async () => {
      // Arrange
      (db.getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`);

      // Act
      const response = await GET(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(404);

      const data = await response.json();

      expect(data).toEqual({ error: 'Product not found' });
    });

    it('should handle server errors', async () => {
      // Arrange
      // Temporarily unmock console.error to allow it to be called during error test
      console.error = vi.fn();

      (db.getProductById as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`);

      // Act
      const response = await GET(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(500);

      const data = await response.json();

      expect(data).toEqual({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalled();

      // Restore the mock for other tests
      console.error = originalConsoleError;
    });
  });

  describe('PUT /api/products/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ userId: null });

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Act
      const response = await PUT(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(401);

      const data = await response.json();

      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should update a product when authenticated with valid data', async () => {
      // Arrange
      // Use string dates in the mock to match what will be returned in the JSON response
      const dateStr = '2025-04-26T04:44:41.625Z';
      const updateData = {
        maHang: 'P001-updated',
        tenHang: 'Updated Product',
        ghiChu: 'Updated notes',
        nhomHang: 'Updated category',
        vietTat: 'UP',
      };

      const updatedProduct = {
        id: 1,
        stt: 1,
        ...updateData,
        nguoiThucHien: 'user123',
        ngayTao: dateStr,
        ngayCapNhat: dateStr,
      };

      (db.getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
      (db.updateProduct as ReturnType<typeof vi.fn>).mockResolvedValue(updatedProduct);

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data).toEqual(updatedProduct);
      expect(db.updateProduct).toHaveBeenCalledWith(productId, updateData, 'user123');
    });

    it('should return 404 when product to update is not found', async () => {
      // Arrange
      const updateData = {
        maHang: 'P001-updated',
        tenHang: 'Updated Product',
      };

      (db.getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(404);

      const data = await response.json();

      expect(data).toEqual({ error: 'Product not found' });
    });

    it('should handle server errors', async () => {
      // Arrange
      // Temporarily unmock console.error to allow it to be called during error test
      console.error = vi.fn();

      // Create a mock product to pass the existence check
      const dateStr = '2025-04-26T04:44:41.625Z';
      const mockProduct = {
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
      };

      // First mock getProductById to return a product
      (db.getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);

      // Then mock updateProduct to throw an error
      (db.updateProduct as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const productId = '1';
      const updateData = {
        tenHang: 'Updated Product',
      };

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(500);

      const data = await response.json();

      expect(data).toEqual({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalled();

      // Restore the mock for other tests
      console.error = originalConsoleError;
    });
  });

  describe('DELETE /api/products/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({ userId: null });

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`, {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(401);

      const data = await response.json();

      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should delete a product when authenticated', async () => {
      // Arrange
      (db.getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
      (db.deleteProduct as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`, {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data).toEqual({ success: true });
      expect(db.deleteProduct).toHaveBeenCalledWith(productId, 'user123');
    });

    it('should return 404 when product to delete is not found', async () => {
      // Arrange
      (db.getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`, {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(404);

      const data = await response.json();

      expect(data).toEqual({ error: 'Product not found' });
    });

    it('should handle server errors', async () => {
      // Arrange
      // Temporarily unmock console.error to allow it to be called during error test
      console.error = vi.fn();

      // Create a mock product to pass the existence check
      const dateStr = '2025-04-26T04:44:41.625Z';
      const mockProduct = {
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
      };

      // First mock getProductById to return a product
      (db.getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);

      // Then mock deleteProduct to throw an error
      (db.deleteProduct as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const productId = '1';
      const request = new NextRequest(`http://localhost:3000/api/products/${productId}`, {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: { id: productId } });

      // Assert
      expect(response.status).toBe(500);

      const data = await response.json();

      expect(data).toEqual({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalled();

      // Restore the mock for other tests
      console.error = originalConsoleError;
    });
  });
});
