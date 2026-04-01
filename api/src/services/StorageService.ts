import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/http';

export interface UploadResult {
  url: string;
  provider: 'local' | 'oss' | 'ipfs';
  metadata?: any;
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
   */
  static async upload(file: Buffer, fileName: string, mimetype: string): Promise<UploadResult> {
    await this.init();

    const ext = path.extname(fileName);
    const id = uuidv4();
    const safeFileName = `${id}${ext}`;
    const filePath = path.join(this.uploadDir, safeFileName);

    try {
      await fs.writeFile(filePath, file);
      
      // 注意：在实际生产中，这里的 URL 应该是 CDN 地址或代理地址
      // 这里暂时使用相对路径
      const url = `/uploads/${safeFileName}`;

      return {
        url,
        provider: 'local',
        metadata: {
          originalName: fileName,
          mimetype,
          size: file.length
        }
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw new AppError(500, 'UPLOAD_FAILED', '文件上传失败');
    }
  }

  /**
   * 上传到 IPFS (区块链协作推荐)
   * 这是一个预留的接口
   */
  static async uploadToIPFS(file: Buffer): Promise<UploadResult> {
    // 实际应集成 Pinata 或 Infura
    console.log('Mock: Uploading to IPFS...');
    const mockCID = `Qm${uuidv4().replace(/-/g, '')}`;
    
    return {
      url: `ipfs://${mockCID}`,
      provider: 'ipfs',
      metadata: { cid: mockCID }
    };
  }
}
