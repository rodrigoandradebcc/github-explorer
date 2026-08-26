import AsyncStorage from '@react-native-async-storage/async-storage';

import { AsyncStorageThemePreference } from '../AsyncStorageThemePreference';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => jest.clearAllMocks());

describe('AsyncStorageThemePreference', () => {
  it('loads a persisted theme using the compatible storage key', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('dark');

    await expect(new AsyncStorageThemePreference().load()).resolves.toBe('dark');
    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@github_explorer/theme_mode');
  });

  it('returns null for an unsupported stored value', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('system');

    await expect(new AsyncStorageThemePreference().load()).resolves.toBeNull();
  });

  it('saves the theme using the compatible storage key', async () => {
    await new AsyncStorageThemePreference().save('light');

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@github_explorer/theme_mode', 'light');
  });
});
