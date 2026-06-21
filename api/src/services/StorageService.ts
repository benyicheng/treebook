import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/http';

export interface UploadResult {
  /**蓄
   * 访问 URL — 统一走 /api/media/assets/:id 路由（需认证 + 审批检查），
   * 不再返回 /uploads/ 直链（安全审计 P2-12）。
   */
  url: string;
  provider: 'local' | 'oss' | 'ipfs';
  /** 文件在磁盘上的相对存储路径（非公开 URL） */
  storagePath: string;
  metadata?: { originalName: string; mimetype: string; size: number };
}

export class StorageService {
  private static uploadDir = path.join(process.cwd(), 'uploads');

  /**
   * 初始化上传目录
   */
  static async init() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 上传文件 (默认本地存储)
   * 未来可扩展为上传到 OSS/S3 或 IPFS
   *
   * 注意：返回的 url 走 /api/media/assets/:id 路由，不暴露文件系统直链。
   * 调用方需要将返回的 storagePath 存入 MediaAsset 表以便后续访问。
   */
  static async upload(file: Buffer, fileName: string, mimetype: string): Promise<UploadResult> {
    await this.init();

    const ext = path.extname(fileName);
    const id = uuidv4();
    const safeFileName = `${id}${ext}`;
    const filePath = path.join(this.uploadDir, safeFileName);

    try {
      await fs.writeFile(filePath, file);

      const storagePath = `uploads/${safeFileName}`;

      return {
        url: `/api/media/assets/${id}`,
        provider: 'local',
        storagePath,
        metadata: {
          originalName: fileName,
          mimetype,
          size: file.length,
        },
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw new AppError(500, 'UPLOAD_FAILED', '文件上传失败');
    }
  }

}
