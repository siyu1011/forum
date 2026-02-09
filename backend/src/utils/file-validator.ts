import crypto from 'crypto';
import fs from 'fs';
import { Readable } from 'stream';
import logger from './logger';

export interface FileValidationResult {
  valid: boolean;
  mimeType?: string;
  extension?: string;
  sha256?: string;
  error?: string;
}

export interface MagicNumberEntry {
  magic: Buffer;
  mimeType: string;
  extension: string;
}

const MAGIC_NUMBERS: MagicNumberEntry[] = [
  { magic: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), mimeType: 'image/jpeg', extension: 'jpg' },
  { magic: Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]), mimeType: 'image/jpeg', extension: 'jpg' },
  { magic: Buffer.from([0xFF, 0xD8, 0xFF, 0xE8]), mimeType: 'image/jpeg', extension: 'jpg' },
  { magic: Buffer.from([0x89, 0x50, 0x4E, 0x47]), mimeType: 'image/png', extension: 'png' },
  { magic: Buffer.from([0x47, 0x49, 0x46, 0x38]), mimeType: 'image/gif', extension: 'gif' },
  { magic: Buffer.from([0x52, 0x49, 0x46, 0x46]), mimeType: 'image/webp', extension: 'webp' },
  { magic: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), mimeType: 'image/png', extension: 'png' },
];

export async function validateFileMagicNumber(
  filePath: string,
  expectedMimeTypes: string[]
): Promise<FileValidationResult> {
  try {
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(8);
    await fd.read(buffer, 0, 8, 0);
    await fd.close();

    for (const entry of MAGIC_NUMBERS) {
      if (buffer.compare(entry.magic, 0, entry.magic.length) === 0) {
        if (expectedMimeTypes.includes(entry.mimeType)) {
          return {
            valid: true,
            mimeType: entry.mimeType,
            extension: entry.extension,
          };
        }
        return {
          valid: false,
          mimeType: entry.mimeType,
          extension: entry.extension,
          error: `文件类型不匹配。期望: ${expectedMimeTypes.join(', ')}, 检测到: ${entry.mimeType}`,
        };
      }
    }

    return {
      valid: false,
      error: '无法识别的文件格式，仅支持 JPEG/PNG/GIF/WEBP',
    };
  } catch (error) {
    logger.error('[FileValidator] Magic number validation error', { error, filePath });
    return {
      valid: false,
      error: '文件验证失败',
    };
  }
}

export async function calculateFileSHA256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => {
      const sha256 = hash.digest('hex');
      logger.debug('[FileValidator] SHA256 calculated', { filePath, sha256 });
      resolve(sha256);
    });
    stream.on('error', (error) => {
      logger.error('[FileValidator] SHA256 calculation error', { error, filePath });
      reject(error);
    });
  });
}

export async function streamWriteWithFsync(
  readStream: Readable,
  destinationPath: string,
  onProgress?: (bytesWritten: number) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const writeStream = fs.createWriteStream(destinationPath);
    let bytesWritten = 0;

    readStream.on('data', (chunk: Buffer) => {
      bytesWritten += chunk.length;
      onProgress?.(bytesWritten);
    });

    readStream.pipe(writeStream);

    writeStream.on('finish', async () => {
      try {
        const fd = await fs.promises.open(destinationPath, 'r');
        try {
          // 尝试同步文件数据到磁盘
          // 注意: fdatasync 和 fsync 在某些文件系统上可能不受支持
          // 如果失败，我们仍然继续，因为数据已经写入
          await fd.datasync();
        } catch (fsyncError) {
          // Windows 上 fdatasync 可能因权限问题失败，记录警告但继续
          logger.warn('[FileValidator] Fsync warning (continuing anyway)', {
            error: fsyncError,
            destinationPath,
          });
        }
        await fd.close();
        logger.info('[FileValidator] File stream write completed', {
          destinationPath,
          bytesWritten,
        });
        resolve();
      } catch (error) {
        logger.error('[FileValidator] Post-write operations failed', { error, destinationPath });
        reject(new Error('文件处理失败'));
      }
    });

    writeStream.on('error', (error) => {
      logger.error('[FileValidator] Write stream error', { error, destinationPath });
      readStream.destroy();
      reject(error);
    });

    readStream.on('error', (error) => {
      logger.error('[FileValidator] Read stream error', { error });
      writeStream.destroy();
      reject(error);
    });
  });
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function validateFileSize(
  size: number,
  maxSize: number
): { valid: boolean; error?: string } {
  if (size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `文件大小超出限制。最大允许 ${maxSizeMB}MB`,
    };
  }
  return { valid: true };
}
