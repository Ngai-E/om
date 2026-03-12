import { Injectable } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UploadService {
  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = join(process.cwd(), 'uploads', 'products', filename);
      await unlink(filePath);
      console.log(`🗑️  Deleted file: ${filename}`);
    } catch (error) {
      console.error(`Failed to delete file ${filename}:`, error.message);
    }
  }

  getFileUrl(filename: string, baseUrl: string): string {
    return `${baseUrl}/uploads/products/${filename}`;
  }
}
