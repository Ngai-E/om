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
};
