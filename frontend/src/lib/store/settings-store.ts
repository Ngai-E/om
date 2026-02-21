import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  phoneNumber: string;
  address: string;
  deliveryMessage: string;
  promoBanner: string;
}

interface SettingsStore {
  settings: StoreSettings;
  updateSettings: (settings: Partial<StoreSettings>) => void;
}

const defaultSettings: StoreSettings = {
  storeName: 'OMEGA Afro Caribbean Superstore',
  storeEmail: 'info@omegastore.com',
  phoneNumber: '07535 316253',
  address: '123 High Street, Bolton, BL1 1AA',
  deliveryMessage: '🚚 Free delivery on orders over £50 in Bolton',
  promoBanner: '🎉 Weekly Deal: 20% off all Grains & Staples | Free delivery over £50',
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
