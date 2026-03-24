import { Injectable, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import * as FormData from 'form-data';
import fetch from 'node-fetch';

@Injectable()
export class UploadService {
  constructor(private settingsService: SettingsService) {}

  async uploadToImgBB(file: Express.Multer.File): Promise<{ url: string; deleteUrl?: string }> {
    const apiKey = await this.settingsService.getImgbbApiKey();
    
    if (!apiKey) {
      throw new BadRequestException('ImgBB API key not configured. Please configure it in settings.');
    }

    const formData = new FormData();
    formData.append('image', file.buffer.toString('base64'));

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to upload to ImgBB');
      }

      const data: any = await response.json();
      
      return {
        url: data.data.url,
        deleteUrl: data.data.delete_url,
      };
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw new BadRequestException('Failed to upload image to ImgBB: ' + error.message);
    }
  }

  async uploadToCloudinary(file: Express.Multer.File): Promise<{ url: string }> {
    const config = await this.settingsService.getCloudinaryConfig();
    
    if (!config) {
      throw new BadRequestException('Cloudinary not configured. Please configure it in settings.');
    }

    const formData = new FormData();
    formData.append('file', file.buffer);
    formData.append('upload_preset', 'ml_default'); // You may need to create a preset

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to upload to Cloudinary');
      }

      const data: any = await response.json();
      
      return {
        url: data.secure_url,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new BadRequestException('Failed to upload image to Cloudinary: ' + error.message);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; deleteUrl?: string }> {
    const service = await this.settingsService.getImageUploadService();
    
    console.log(`📤 Uploading image using ${service} service...`);

    switch (service) {
      case 'imgbb':
        return this.uploadToImgBB(file);
      
      case 'cloudinary':
        return this.uploadToCloudinary(file);
      
      default:
        throw new BadRequestException(`Unsupported upload service: ${service}`);
    }
  }

  async uploadVideo(file: Express.Multer.File): Promise<{ url: string; deleteUrl?: string }> {
    const service = await this.settingsService.getImageUploadService();
    
    console.log(`📤 Uploading video using ${service} service...`);

    // For now, we'll use Cloudinary for videos as ImgBB doesn't support video uploads
    // You can extend this to support other video hosting services
    if (service === 'cloudinary') {
      return this.uploadVideoToCloudinary(file);
    }
    
    // Fallback to Cloudinary for videos
    console.log('⚠️  ImgBB does not support video uploads, using Cloudinary instead');
    return this.uploadVideoToCloudinary(file);
  }

  async uploadVideoToCloudinary(file: Express.Multer.File): Promise<{ url: string }> {
    const config = await this.settingsService.getCloudinaryConfig();
    
    if (!config) {
      throw new BadRequestException('Cloudinary not configured. Please configure it in settings for video uploads.');
    }

    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    formData.append('upload_preset', 'ml_default');
    formData.append('resource_type', 'video');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to upload video to Cloudinary');
      }

      const data: any = await response.json();
      
      return {
        url: data.secure_url,
      };
    } catch (error) {
      console.error('Cloudinary video upload error:', error);
      throw new BadRequestException('Failed to upload video to Cloudinary: ' + error.message);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    // For ImgBB/Cloudinary, deletion would need to be handled differently
    // This is a placeholder for now
    console.log(`🗑️  Delete requested for: ${filename}`);
  }
}
