import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_PREFIX = 'token-storage:';

const HYDRATION_KEYS = [
  'access_token',
  'refresh_token',
  'onboarding_completed',
  'firebase_uid',
];

const AUTH_KEYS = ['access_token', 'refresh_token', 'firebase_uid'];

const tokenCache: Record<string, string> = {};
const storageCache: Record<string, string> = {};

let hydrationResolver: (() => void) | null = null;
const hydrationReady = new Promise<void>((resolve) => {
  hydrationResolver = resolve;
});

let hydrated = false;

export const hydrateTokens = async (): Promise<void> => {
  if (hydrated) return;

  try {
    const pairs = await AsyncStorage.multiGet(
      HYDRATION_KEYS.map((k) => `${TOKEN_PREFIX}${k}`)
    );
    pairs.forEach(([key, value]) => {
      if (value) {
        tokenCache[key.replace(TOKEN_PREFIX, '')] = value;
      }
    });
  } catch (err) {
    console.error('Token hydration failed:', err);
  }

  hydrated = true;
  hydrationResolver?.();
};

if (typeof window !== 'undefined') {
  hydrateTokens();
}

export { hydrationReady };

export const tokenStorage = {
  set: (key: string, value: string) => {
    tokenCache[key] = value;
    AsyncStorage.setItem(`${TOKEN_PREFIX}${key}`, value).catch(console.error);
  },
  getString: (key: string): string | null => {
    return tokenCache[key] || null;
  },
  delete: (key: string) => {
    delete tokenCache[key];
    AsyncStorage.removeItem(`${TOKEN_PREFIX}${key}`).catch(console.error);
  },
  clearAuth: () => {
    AUTH_KEYS.forEach((key) => {
      delete tokenCache[key];
      AsyncStorage.removeItem(`${TOKEN_PREFIX}${key}`).catch(console.error);
    });
  },
  clearAll: () => {
    Object.keys(tokenCache).forEach((key) => {
      delete tokenCache[key];
      AsyncStorage.removeItem(`${TOKEN_PREFIX}${key}`).catch(console.error);
    });
  },
};

export const storage = {
  set: (key: string, value: string) => {
    storageCache[key] = value;
    AsyncStorage.setItem(`my-app-storage:${key}`, value).catch(console.error);
  },
  getString: (key: string): string | null => {
    return storageCache[key] || null;
  },
  delete: (key: string) => {
    delete storageCache[key];
    AsyncStorage.removeItem(`my-app-storage:${key}`).catch(console.error);
  },
};

export const mmkvStorage = {
  setItem: (key: string, value: string) => {
    storageCache[key] = value;
    AsyncStorage.setItem(key, value).catch(console.error);
  },
  getItem: (key: string): string | null => {
    return storageCache[key] || null;
  },
  removeItem: (key: string) => {
    delete storageCache[key];
    AsyncStorage.removeItem(key).catch(console.error);
  },
};
