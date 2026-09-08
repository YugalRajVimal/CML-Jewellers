/**
 * Abstracted media storage interface. Controllers/services depend on this
 * interface, never on Cloudinary directly, so the provider can be swapped
 * later (e.g. to S3) without touching call sites.
 */
export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface MediaService {
  upload(fileBuffer: Buffer, options?: { folder?: string; filename?: string }): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
  getUrl(publicId: string, transform?: string): string;
}
