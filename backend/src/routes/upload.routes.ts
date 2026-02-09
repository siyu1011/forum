import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';
import { config } from '../config';
import logger from '../utils/logger';
import {
  validateFileMagicNumber,
  calculateFileSHA256,
  streamWriteWithFsync,
  validateFileSize,
} from '../utils/file-validator';
import { Attachment } from '../models/attachment.model';

const router = Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = path.resolve(config.upload.dir);
    logger.info('[Upload] Preparing upload directory', { uploadDir });

    fs.promises.mkdir(uploadDir, { recursive: true })
      .then(() => {
        logger.debug('[Upload] Upload directory ready', { uploadDir });
        cb(null, uploadDir);
      })
      .catch((error) => {
        logger.error('[Upload] Failed to create upload directory', { error, uploadDir });
        cb(new Error('无法创建上传目录'));
      });
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    logger.debug('[Upload] Generated filename', { filename, originalname: file.originalname });
    cb(null, filename);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.debug('[Upload] MIME type accepted', { mimetype: file.mimetype });
    cb(null, true);
  } else {
    logger.warn('[Upload] MIME type rejected', { mimetype: file.mimetype, allowedTypes: ALLOWED_MIME_TYPES });
    cb(new Error('不支持的文件类型，仅支持 JPEG/PNG/GIF/WEBP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
  },
});

router.post(
  '/image',
  authMiddleware,
  upload.single('file'),
  asyncHandler(async (req: any, res: any) => {
    if (!req.file) {
      logger.warn('[Upload] No file provided in request');
      return ApiResponse.badRequest(res, '请上传文件');
    }

    const originalPath = path.resolve(config.upload.dir, req.file.filename);
    const tempPath = path.resolve(config.upload.dir, `temp_${req.file.filename}`);
    const maxSize = config.upload.maxSize;

    logger.info('[Upload] Processing file upload', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      maxSize,
    });

    try {
      await fs.promises.rename(originalPath, tempPath);
      logger.debug('[Upload] File moved to temp location', { tempPath });

      const sizeValidation = validateFileSize(req.file.size, maxSize);
      if (!sizeValidation.valid) {
        await fs.promises.unlink(tempPath).catch(() => {});
        logger.warn('[Upload] File size validation failed', { size: req.file.size, maxSize });
        return ApiResponse.badRequest(res, sizeValidation.error);
      }

      const magicValidation = await validateFileMagicNumber(tempPath, ALLOWED_MIME_TYPES);
      if (!magicValidation.valid) {
        await fs.promises.unlink(tempPath).catch(() => {});
        logger.warn('[Upload] Magic number validation failed', { error: magicValidation.error });
        return ApiResponse.badRequest(res, magicValidation.error);
      }

      logger.debug('[Upload] Starting stream write with fsync', { destination: originalPath });

      const fileStream = fs.createReadStream(tempPath);
      await streamWriteWithFsync(fileStream, originalPath);
      await fs.promises.unlink(tempPath).catch((err) => logger.warn('[Upload] Failed to delete temp file', { err }));

      const finalStats = await fs.promises.stat(originalPath);
      if (finalStats.size !== req.file.size) {
        await fs.promises.unlink(originalPath).catch(() => {});
        logger.error('[Upload] File size mismatch after write', {
          expected: req.file.size,
          actual: finalStats.size,
        });
        return ApiResponse.serverError(res, '文件写入不完整');
      }

      const sha256 = await calculateFileSHA256(originalPath);
      logger.info('[Upload] File validated and saved', {
        filename: req.file.filename,
        size: finalStats.size,
        sha256: sha256.substring(0, 16) + '...',
      });

      let attachmentId: number | undefined;
      try {
        const attachment = await Attachment.create({
          user_id: (req as any).user?.id || 0,
          filename: req.file.filename,
          file_type: magicValidation.extension || path.extname(req.file.originalname).slice(1),
          file_size: finalStats.size,
          url: `${config.upload.url}/${req.file.filename}`,
          mime_type: magicValidation.mimeType || req.file.mimetype,
          is_image: true,
        });
        attachmentId = attachment.id;
        logger.info('[Upload] Attachment record created', { attachmentId, filename: req.file.filename });
      } catch (dbError) {
        logger.error('[Upload] Failed to create attachment record', { dbError, filename: req.file.filename });
      }

      const fileUrl = `${config.upload.url}/${req.file.filename}`;
      return ApiResponse.success(
        res,
        {
          url: fileUrl,
          filename: req.file.originalname,
          size: finalStats.size,
          mimeType: magicValidation.mimeType || req.file.mimetype,
          sha256: sha256,
          attachmentId,
        },
        '上传成功',
        201
      );
    } catch (error) {
      logger.error('[Upload] Upload processing failed', { error, filename: req.file.filename });
      try {
        if (await fs.promises.stat(originalPath).catch(() => null)) {
          await fs.promises.unlink(originalPath);
        }
      } catch (cleanupError) {
        logger.warn('[Upload] Cleanup failed', { cleanupError });
      }
      return ApiResponse.serverError(res, '文件上传失败，请稍后重试');
    }
  })
);

export default router;
