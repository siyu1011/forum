import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import crypto from 'crypto';
import {
  validateFileMagicNumber,
  calculateFileSHA256,
  streamWriteWithFsync,
  sanitizeFilename,
  validateFileSize,
} from '../utils/file-validator';

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
    unlink: jest.fn(),
    stat: jest.fn(),
    rename: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    rmdir: jest.fn(),
  },
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
}));

describe('FileValidator', () => {
  const testTempDir = path.join(__dirname, 'test-fixtures');

  beforeAll(async () => {
    await fs.promises.mkdir(testTempDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      const files = await fs.promises.readdir(testTempDir);
      await Promise.all(files.map((file) => fs.promises.unlink(path.join(testTempDir, file))));
      await fs.promises.rmdir(testTempDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFileMagicNumber', () => {
    const createTestFile = async (content: Buffer, filename: string): Promise<string> => {
      const filePath = path.join(testTempDir, filename);
      await fs.promises.writeFile(filePath, content);
      return filePath;
    };

    it('should validate valid JPEG file', async () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const filePath = await createTestFile(jpegBuffer, 'test.jpg');

      const result = await validateFileMagicNumber(filePath, ['image/jpeg', 'image/png']);

      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.extension).toBe('jpg');
    });

    it('should validate valid PNG file', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      ]);
      const filePath = await createTestFile(pngBuffer, 'test.png');

      const result = await validateFileMagicNumber(filePath, ['image/png']);

      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('png');
    });

    it('should validate valid GIF file', async () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);
      const filePath = await createTestFile(gifBuffer, 'test.gif');

      const result = await validateFileMagicNumber(filePath, ['image/gif']);

      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/gif');
      expect(result.extension).toBe('gif');
    });

    it('should validate valid WEBP file', async () => {
      const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
      const filePath = await createTestFile(webpBuffer, 'test.webp');

      const result = await validateFileMagicNumber(filePath, ['image/webp']);

      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/webp');
      expect(result.extension).toBe('webp');
    });

    it('should reject file with wrong mime type', async () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const filePath = await createTestFile(jpegBuffer, 'test.jpg');

      const result = await validateFileMagicNumber(filePath, ['image/png', 'image/gif']);

      expect(result.valid).toBe(false);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.error).toContain('文件类型不匹配');
    });

    it('should reject unrecognized file format', async () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      const filePath = await createTestFile(invalidBuffer, 'test.bin');

      const result = await validateFileMagicNumber(filePath, ['image/jpeg', 'image/png']);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('无法识别的文件格式');
    });

    it('should handle file read errors gracefully', async () => {
      const nonExistentPath = path.join(testTempDir, 'nonexistent.jpg');

      (fs.promises.open as jest.Mock).mockRejectedValue(new Error('ENOENT: no such file'));

      const result = await validateFileMagicNumber(nonExistentPath, ['image/jpeg']);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('文件验证失败');
    });

    it('should handle partial magic number match', async () => {
      const partialPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x00, 0x00, 0x00, 0x00]);
      const filePath = await createTestFile(partialPngBuffer, 'test.png');

      const result = await validateFileMagicNumber(filePath, ['image/png']);

      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/png');
    });
  });

  describe('calculateFileSHA256', () => {
    const createTestFile = async (content: string | Buffer, filename: string): Promise<string> => {
      const filePath = path.join(testTempDir, filename);
      await fs.promises.writeFile(filePath, content);
      return filePath;
    };

    it('should calculate SHA256 hash correctly', async () => {
      const content = 'Hello, World!';
      const filePath = await createTestFile(content, 'hello.txt');

      const expectedHash = crypto.createHash('sha256').update(content).digest('hex');

      const result = await calculateFileSHA256(filePath);

      expect(result).toBe(expectedHash);
    });

    it('should calculate SHA256 for binary data', async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
      const filePath = await createTestFile(binaryData, 'binary.bin');

      const expectedHash = crypto.createHash('sha256').update(binaryData).digest('hex');

      const result = await calculateFileSHA256(filePath);

      expect(result).toBe(expectedHash);
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle empty file', async () => {
      const filePath = await createTestFile(Buffer.from([]), 'empty.txt');

      const expectedHash = crypto.createHash('sha256').update('').digest('hex');

      const result = await calculateFileSHA256(filePath);

      expect(result).toBe(expectedHash);
    });

    it('should handle concurrent hash calculations', async () => {
      const content = 'Test content for concurrent hashing';
      const filePath = await createTestFile(content, 'concurrent.txt');

      const results = await Promise.all([
        calculateFileSHA256(filePath),
        calculateFileSHA256(filePath),
        calculateFileSHA256(filePath),
      ]);

      const expectedHash = crypto.createHash('sha256').update(content).digest('hex');

      results.forEach((hash) => {
        expect(hash).toBe(expectedHash);
      });
    });
  });

  describe('streamWriteWithFsync', () => {
    it('should write stream to file with fsync', async () => {
      const destinationPath = path.join(testTempDir, 'written.txt');
      const content = 'Stream content to write';

      const readable = new Readable();
      readable._read = () => {};
      readable.push(content);
      readable.push(null);

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
        end: jest.fn(),
      };

      const mockFileDescriptor: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
      (fs.promises.open as jest.Mock).mockResolvedValue(mockFileDescriptor);

      await streamWriteWithFsync(readable, destinationPath);

      expect(fs.createWriteStream).toHaveBeenCalledWith(destinationPath);
      expect(fs.promises.open).toHaveBeenCalledWith(destinationPath, 'r');
      expect(mockFileDescriptor.datasync).toHaveBeenCalled();
      expect(mockFileDescriptor.close).toHaveBeenCalled();
    });

    it('should track progress during write', async () => {
      const destinationPath = path.join(testTempDir, 'progress.txt');
      const content = Buffer.from('Progress tracking test content');

      const readable = new Readable();
      readable._read = () => {};
      readable.push(content);
      readable.push(null);

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
      };

      const mockFileDescriptor: any = {
        datasync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
      (fs.promises.open as jest.Mock).mockResolvedValue(mockFileDescriptor);

      const progressCallback = jest.fn();
      await streamWriteWithFsync(readable, destinationPath, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(content.length);
    });

    it('should handle write stream errors', async () => {
      const destinationPath = path.join(testTempDir, 'error.txt');
      const readable = new Readable();
      readable._read = () => {};
      readable.push('test');
      readable.push(null);

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: (error?: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Write error')), 10);
          }
          return mockWriteStream;
        }),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      await expect(streamWriteWithFsync(readable, destinationPath)).rejects.toThrow('Write error');
    });

    it('should handle read stream errors', async () => {
      const destinationPath = path.join(testTempDir, 'read-error.txt');

      const mockReadable = new Readable();
      mockReadable._read = () => {};

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
        destroy: jest.fn(),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      setTimeout(() => {
        mockReadable.emit('error', new Error('Read error'));
      }, 10);

      await expect(streamWriteWithFsync(mockReadable, destinationPath)).rejects.toThrow('Read error');
      expect(mockWriteStream.destroy).toHaveBeenCalled();
    });

    it('should handle fsync errors', async () => {
      const destinationPath = path.join(testTempDir, 'fsync-error.txt');
      const readable = new Readable();
      readable._read = () => {};
      readable.push('test');
      readable.push(null);

      const mockWriteStream: any = {
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockWriteStream;
        }),
      };

      const mockFileDescriptor: any = {
        datasync: jest.fn().mockRejectedValue(new Error('Fsync failed')),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
      (fs.promises.open as jest.Mock).mockResolvedValue(mockFileDescriptor);

      await expect(streamWriteWithFsync(readable, destinationPath)).rejects.toThrow('文件同步到磁盘失败');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove special characters', () => {
      const result = sanitizeFilename('test@file#name.exe');
      expect(result).toBe('test_file_name.exe');
    });

    it('should keep alphanumeric and dot characters', () => {
      const result = sanitizeFilename('my.image.file.jpg');
      expect(result).toBe('my.image.file.jpg');
    });

    it('should replace spaces with underscores', () => {
      const result = sanitizeFilename('my file name.png');
      expect(result).toBe('my_file_name.png');
    });

    it('should handle empty string', () => {
      const result = sanitizeFilename('');
      expect(result).toBe('');
    });

    it('should handle string with only special characters', () => {
      const result = sanitizeFilename('!@#$%^&*()');
      expect(result).toBe('__________');
    });

    it('should handle unicode characters', () => {
      const result = sanitizeFilename('文件名称.png');
      expect(result).toBe('____.png');
    });

    it('should not modify valid filenames', () => {
      const result = sanitizeFilename('valid_filename_123.jpg');
      expect(result).toBe('valid_filename_123.jpg');
    });

    it('should handle multiple consecutive special characters', () => {
      const result = sanitizeFilename('file@@@name###.exe');
      expect(result).toBe('file___name___.exe');
    });
  });

  describe('validateFileSize', () => {
    it('should pass valid file size', () => {
      const result = validateFileSize(1024 * 1024, 10 * 1024 * 1024);
      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding max size', () => {
      const maxSize = 5 * 1024 * 1024;
      const result = validateFileSize(10 * 1024 * 1024, maxSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件大小超出限制');
      expect(result.error).toContain('5.00MB');
    });

    it('should pass zero size file', () => {
      const result = validateFileSize(0, 1024 * 1024);
      expect(result.valid).toBe(true);
    });

    it('should handle exact size limit', () => {
      const maxSize = 1024 * 1024;
      const result = validateFileSize(maxSize, maxSize);
      expect(result.valid).toBe(true);
    });

    it('should reject file one byte over limit', () => {
      const maxSize = 1024;
      const result = validateFileSize(maxSize + 1, maxSize);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件大小超出限制');
    });

    it('should handle large file sizes correctly', () => {
      const maxSize = 10 * 1024 * 1024 * 1024;
      const result = validateFileSize(maxSize, maxSize);
      expect(result.valid).toBe(true);
    });

    it('should display max size in error message with 2 decimal places', () => {
      const maxSize = 5.5 * 1024 * 1024;
      const result = validateFileSize(10 * 1024 * 1024, maxSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('5.50MB');
    });
  });
});
