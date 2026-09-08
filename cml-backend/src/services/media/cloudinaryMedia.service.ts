import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { MediaService, UploadResult } from './MediaService.interface';
import { AppError } from '../../utils/AppError';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

const DEFAULT_FOLDER = 'cml-jewellers';

class CloudinaryMediaService implements MediaService {
  upload(fileBuffer: Buffer, options?: { folder?: string; filename?: string }): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: options?.folder ? `${DEFAULT_FOLDER}/${options.folder}` : DEFAULT_FOLDER,
          public_id: options?.filename,
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(AppError.internal('Image upload failed', 'MEDIA_UPLOAD_FAILED', error?.message));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );
      stream.end(fileBuffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw AppError.internal('Image deletion failed', 'MEDIA_DELETE_FAILED', (error as Error)?.message);
    }
  }

  getUrl(publicId: string, transform?: string): string {
    return cloudinary.url(publicId, transform ? { transformation: transform } : undefined);
  }
}

// Single shared instance — controllers import this, not the class or Cloudinary SDK directly.
export const mediaService: MediaService = new CloudinaryMediaService();
