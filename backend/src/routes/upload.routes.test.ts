import request from 'supertest';
import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Mock config
jest.mock('../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key',
      expiresIn: '7d',
      refreshExpiresIn: '30d',
    },
    upload: {
      maxSize: 10 * 1024 * 1024,
      dir: '/tmp/test-uploads',
      url: '/uploads',
    },
    database: {
      name: 'test_db',
      user: 'test_user',
      password: 'test_password',
      host: 'localhost',
      port: 3306,
    },
  },
}));

// Mock database module
jest.mock('../config/database', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(undefined),
    define: jest.fn().mockReturnValue({
      init: jest.fn(),
      associate: jest.fn(),
    }),
  },
}));

// Mock DataTypes
jest.mock('sequelize', () => ({
  DataTypes: {
    BIGINT: { UNSIGNED: { type: {} } },
    INTEGER: { UNSIGNED: { type: {} } },
    STRING: () => ({ type: {} }),
    TEXT: () => ({ type: {} }),
    BOOLEAN: () => ({ type: {} }),
    DATE: () => ({ type: {} }),
  },
  Model: class {
    static init = jest.fn();
    static associate = jest.fn();
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    open: jest.fn(),
    unlink: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn(),
    rename: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
  },
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
}));

// Mock Attachment model
jest.mock('../models', () => ({
  Attachment: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      filename: 'test.jpg',
      file_type: 'jpg',
      file_size: 1024,
      url: '/uploads/test.jpg',
      mime_type: 'image/jpeg',
      is_image: true,
    }),
  },
}));

// Import after mocks
import { config } from '../config';
import uploadRoutes from '../routes/upload.routes';
import { Attachment } from '../models';

describe('Upload Routes', () => {
  let app: Express;
  const testSecret = config.jwt.secret;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/v1/upload', uploadRoutes);
  });

  const generateToken = (payload: { id: number; username: string; email: string; role: string }) => {
    return jwt.sign(payload, testSecret, { expiresIn: '7d' });
  };

  describe('POST /api/v1/upload/image', () => {
    it('should return 401 when no authentication token provided', async () => {
      const response = await request(app)
        .post('/api/v1/upload/image')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });

    it('should return 400 when no file provided', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请上传文件');
    });

    it('should upload valid JPEG image successfully', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      
      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
        end: jest.fn(),
      };

      const mockFileForFsync: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor)
        .mockResolvedValueOnce(mockFileForFsync);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: jpegBuffer.length })
        .mockResolvedValueOnce({ size: jpegBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('上传成功');
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('filename', 'test.jpg');
      expect(response.body.data).toHaveProperty('mimeType', 'image/jpeg');
      expect(response.body.data).toHaveProperty('sha256');
      expect(response.body.data.sha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should upload valid PNG image successfully', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      ]);

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
      };

      const mockFileForFsync: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor)
        .mockResolvedValueOnce(mockFileForFsync);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: pngBuffer.length })
        .mockResolvedValueOnce({ size: pngBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', pngBuffer, 'test.png')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mimeType).toBe('image/png');
    });

    it('should reject invalid file type (magic number mismatch)', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
      };

      const mockFileForFsync: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor)
        .mockResolvedValueOnce(mockFileForFsync);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: invalidBuffer.length })
        .mockResolvedValueOnce({ size: invalidBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', invalidBuffer, 'test.bin')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无法识别的文件格式');
    });

    it('should reject file that exceeds size limit', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1, 0xFF);

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockFileForFsync: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor)
        .mockResolvedValueOnce(mockFileForFsync);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: largeBuffer.length })
        .mockResolvedValueOnce({ size: largeBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', largeBuffer, 'large.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文件大小超出限制');
    });

    it('should handle disk full error during write', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: (error?: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('ENOSPC: no space left on device')), 10);
          }
          return mockWriteStream;
        }),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: jpegBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('文件上传失败，请稍后重试');
    });

    it('should handle permission denied error', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: (error?: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('EACCES: permission denied')), 10);
          }
          return mockWriteStream;
        }),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: jpegBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should create attachment record in database', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
      };

      const mockFileForFsync: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor)
        .mockResolvedValueOnce(mockFileForFsync);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: jpegBuffer.length })
        .mockResolvedValueOnce({ size: jpegBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(201);

      expect(Attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          filename: expect.any(String),
          file_type: 'jpg',
          file_size: expect.any(Number),
          url: expect.stringContaining('/uploads/'),
          mime_type: 'image/jpeg',
          is_image: true,
        })
      );

      expect(response.body.data).toHaveProperty('attachmentId', 1);
    });

    it('should handle database errors gracefully', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);

      (Attachment.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
      };

      const mockFileForFsync: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor)
        .mockResolvedValueOnce(mockFileForFsync);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: jpegBuffer.length })
        .mockResolvedValueOnce({ size: jpegBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attachmentId).toBeUndefined();
    });

    it('should verify file size matches after write', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
      };

      const mockFileForFsync: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor)
        .mockResolvedValueOnce(mockFileForFsync);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: jpegBuffer.length })
        .mockResolvedValueOnce({ size: jpegBuffer.length + 100 });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('文件写入不完整');
    });

    it('should cleanup files on error', async () => {
      const token = generateToken({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);

      const mockFileDescriptor: any = {
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockReadStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            setTimeout(callback, 10);
          }
          return mockReadStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: (error?: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Write failed')), 10);
          }
          return mockWriteStream;
        }),
      };

      (fs.promises.open as jest.Mock)
        .mockResolvedValueOnce(mockFileDescriptor);
      
      (fs.promises.stat as jest.Mock)
        .mockResolvedValueOnce({ size: jpegBuffer.length })
        .mockResolvedValueOnce({ size: jpegBuffer.length });
      
      (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', jpegBuffer, 'test.jpg')
        .expect(500);

      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });
});
