import { apiClient } from './client';

export const settingsApi = {
  /**
   * Get guest checkout enabled status
   */
  async getGuestCheckoutEnabled(): Promise<boolean> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/guest-checkout`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Default to true if API fails
      return true;
    }

    const data = await response.json();
    return data.enabled ?? true;
  },

  /**
   * Get all public settings
   */
  async getPublicSettings(): Promise<any> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }

    return response.json();
  },

  /**
   * Get all settings (requires auth)
   */
  async getSettings(): Promise<any> {
    const { data } = await apiClient.get('/settings');
    return data;
  },

  /**
   * Update image upload setting
   */
  async updateImageUpload(enabled: boolean): Promise<void> {
    await apiClient.put('/settings/image-upload', { enabled });
  },

  /**
   * Update image link setting
   */
  async updateImageLink(enabled: boolean): Promise<void> {
    await apiClient.put('/settings/image-link', { enabled });
  },

  /**
   * Update image upload service
   */
  async updateImageUploadService(service: 'imgbb' | 'cloudinary'): Promise<void> {
    await apiClient.put('/settings/image-upload-service', { service });
  },

  /**
   * Update ImgBB API key
   */
  async updateImgbbApiKey(apiKey: string): Promise<void> {
    await apiClient.put('/settings/imgbb-api-key', { apiKey });
  },

  /**
   * Update Cloudinary configuration
   */
  async updateCloudinaryConfig(config: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  }): Promise<void> {
    await apiClient.put('/settings/cloudinary-config', config);
  },

  /**
   * Get upload configuration with actual API keys (Admin only)
   */
  async getUploadConfig(): Promise<{
    service: 'imgbb' | 'cloudinary';
    imgbbApiKey: string | null;
    cloudinaryConfig: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    } | null;
  }> {
    const { data } = await apiClient.get('/settings/upload-config');
    return data;
  },
};
