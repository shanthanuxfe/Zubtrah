type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const fallbackStorage = new Map<string, string>();
const DEVICE_ID_STORAGE_KEY = 'zubtrah_device_id_v1';
const LEGACY_STORAGE_KEYS = ['zubtrah_subscriptions_v1', 'app_settings_v1'];

function getBrowserStorage(): StorageLike | null {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage as StorageLike;
  }
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage as StorageLike;
  }
  return null;
}

function getOrCreateDeviceId(): string {
  const storage = getLocalStorage();
  const existing = storage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;

  const nextId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  storage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
}

function buildNamespacedKey(baseKey: string, deviceId: string): string {
  return `${baseKey}:${deviceId}`;
}

export function ensureStorageIsolation(): void {
  const storage = getLocalStorage();
  const deviceId = getOrCreateDeviceId();

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacyValue = storage.getItem(legacyKey);
    if (!legacyValue) {
      storage.removeItem(legacyKey);
      continue;
    }

    const namespacedKey = buildNamespacedKey(legacyKey, deviceId);
    if (!storage.getItem(namespacedKey)) {
      storage.setItem(namespacedKey, legacyValue);
    }
    storage.removeItem(legacyKey);
  }
}

export function getLocalStorage(): StorageLike {
  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    return browserStorage;
  }

  return {
    getItem: (key: string) => fallbackStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      fallbackStorage.set(key, value);
    },
    removeItem: (key: string) => {
      fallbackStorage.delete(key);
    },
  };
}

export function getNamespacedStorageKey(baseKey: string): string {
  const deviceId = getOrCreateDeviceId();
  return buildNamespacedKey(baseKey, deviceId);
}
