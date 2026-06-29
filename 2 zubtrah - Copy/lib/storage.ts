type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const fallbackStorage = new Map<string, string>();

function getBrowserStorage(): StorageLike | null {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage as StorageLike;
  }
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage as StorageLike;
  }
  return null;
}

function createNamespaceKey(baseKey: string): string {
  const browserFingerprint = [
    typeof window !== 'undefined' ? window.location.hostname : 'unknown-host',
    typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown-user-agent',
    typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown-screen',
    typeof navigator !== 'undefined' ? navigator.language : 'unknown-language',
  ].join('|');

  const hash = Array.from(browserFingerprint).reduce((acc, char) => {
    acc = (acc << 5) - acc + char.charCodeAt(0);
    return acc & acc;
  }, 0);

  return `${baseKey}:${Math.abs(hash).toString(16)}`;
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
  return createNamespaceKey(baseKey);
}
