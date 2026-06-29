import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { lightColors, darkColors, type AppColors } from '@/lib/theme';
import { type Subscription, getSubscriptions } from '@/lib/supabase';
import { syncAllNotifications } from '@/lib/notifications';
import { ensureStorageIsolation, getLocalStorage, getNamespacedStorageKey } from '@/lib/storage';

ensureStorageIsolation();
const STORAGE_KEY = getNamespacedStorageKey('app_settings_v1');

export type AppSettings = {
  notifications: boolean;
  reminderDays: number;
  currency: string;
  darkMode: boolean;
  userName: string;
  userEmail: string;
  userPhoto: string | null;
};

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  reminderDays: 3,
  currency: 'USD $',
  darkMode: false,
  userName: 'Name',
  userEmail: 'example@gmail.com',
  userPhoto: null,
};

type SettingsContextValue = {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
  colors: AppColors;
  // True until settings have been loaded from local storage
  hydrated: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storage = getLocalStorage();
        const raw = storage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppSettings>;
          // Merge with defaults so new fields don't break old saves
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // Ignore — fall back to defaults
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // Fire-and-forget persistence — never block UI
      try {
        getLocalStorage().setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore — fall back to in-memory state
      }
      return next;
    });
  }, []);

  const colors = useMemo(
    () => (settings.darkMode ? darkColors : lightColors),
    [settings.darkMode]
  );

  return (
    <SettingsContext.Provider value={{ settings, update, colors, hydrated }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

// Convenience hook — returns the current theme colors
export function useThemeColors(): AppColors {
  return useSettings().colors;
}

// Hook that keeps scheduled notifications in sync with settings + subscriptions
export function useNotificationSync(subscriptions: Subscription[], skip = false) {
  const { settings, hydrated } = useSettings();

  useEffect(() => {
    if (!hydrated || skip) return;
    syncAllNotifications(subscriptions, settings.notifications, settings.reminderDays);
  }, [
    subscriptions,
    settings.notifications,
    settings.reminderDays,
    hydrated,
    skip,
  ]);
}

// Sync notifications when a subscription is added/edited/deleted.
// Call this right after the Supabase mutation completes, with the latest
// list fetched back from the database.
export async function resyncNotifications(settings: AppSettings): Promise<void> {
  if (!settings.notifications) return;
  const data = await getSubscriptions();
  await syncAllNotifications(
    data as Subscription[],
    settings.notifications,
    settings.reminderDays
  );
}

// Currency symbol helper
export function getCurrencySymbol(currency: string): string {
  if (currency.includes('€')) return '€';
  if (currency.includes('£')) return '£';
  if (currency.includes('₹')) return '₹';
  if (currency.includes('¥') && currency.startsWith('JPY')) return '¥';
  if (currency.includes('¥') && currency.startsWith('CNY')) return '¥';
  if (currency.includes('₽')) return '₽';
  if (currency.includes('R$')) return 'R$';
  if (currency.includes('AED')) return 'د.إ';
  if (currency.includes('SGD')) return 'S$';
  if (currency.includes('AUD')) return 'A$';
  if (currency.includes('CAD')) return 'C$';
  return '$';
}
