import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  deliveryMessage: string;
  promoBanner: string;
  aboutUs: string;
  contactEmail: string;
  openingHours: string;
  googleMapsEmbedUrl: string;
  version: number;
}

interface SettingsStore {
  settings: StoreSettings;
  updateSettings: (settings: Partial<StoreSettings>) => void;
}

const defaultSettings: StoreSettings = {
  storeName: 'OMEGA Afro Caribbean Superstore',
  storeEmail: 'info@omegastore.com',
  phoneNumber: '07535 316253',
  whatsappNumber: '+44 7535 316253',
  address: '123 High Street, Bolton, BL1 1AA',
  deliveryMessage: '🚚 Free delivery on orders over £50 in Bolton',
  promoBanner: '🎉 Weekly Deal: 20% off all Grains & Staples | Free delivery over £50',
  aboutUs: 'Your trusted source for authentic African and Caribbean groceries in Bolton.',
  contactEmail: 'info@omega-groceries.co.uk',
  openingHours: 'Mon-Sat: 9:00 AM - 8:00 PM\nSunday: 10:00 AM - 6:00 PM',
  googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2373.123456789!2d-2.428!3d53.577!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTPCsDM0JzM3LjIiTiAywrAyNScwNC44Ilc!5e0!3m2!1sen!2suk!4v1234567890',
  version: 1,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'store-settings',
    }
  )
);
