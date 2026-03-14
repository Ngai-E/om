/**
 * Image Upload Utility
 * Supports ImgBB and Cloudinary
 */

export type ImageUploadService = 'imgbb' | 'cloudinary';

export interface ImageUploadConfig {
  service: ImageUploadService;
  imgbbApiKey?: string;
  cloudinaryConfig?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

export interface ImageUploadResult {
  url: string;
  deleteUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Upload image to ImgBB
 */
async function uploadToImgBB(file: File, apiKey: string): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload to ImgBB');
  }

  const data = await response.json();
  
  return {
    url: data.data.url,
    deleteUrl: data.data.delete_url,
    thumbnailUrl: data.data.thumb?.url,
  };
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(
  file: File,
  config: { cloudName: string; apiKey: string; apiSecret: string }
): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'unsigned'); // You may need to create an unsigned preset
  
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

  const data = await response.json();
  
  return {
    url: data.secure_url,
    thumbnailUrl: data.thumbnail_url,
  };
}

/**
 * Main upload function that routes to the appropriate service
 */
export async function uploadImage(
  file: File,
  config: ImageUploadConfig
): Promise<ImageUploadResult> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 10MB');
  }

  // Route to appropriate service
  switch (config.service) {
    case 'imgbb':
      if (!config.imgbbApiKey) {
        throw new Error('ImgBB API key not configured');
      }
      return uploadToImgBB(file, config.imgbbApiKey);

    case 'cloudinary':
      if (!config.cloudinaryConfig) {
        throw new Error('Cloudinary configuration not set');
      }
      return uploadToCloudinary(file, config.cloudinaryConfig);

    default:
      throw new Error(`Unsupported upload service: ${config.service}`);
  }
}
