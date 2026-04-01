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
  storeName: '',
  storeEmail: '',
  phoneNumber: '',
  whatsappNumber: '',
  address: '',
  deliveryMessage: '',
  promoBanner: '',
  aboutUs: '',
  contactEmail: '',
  openingHours: '',
  googleMapsEmbedUrl: '',
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
