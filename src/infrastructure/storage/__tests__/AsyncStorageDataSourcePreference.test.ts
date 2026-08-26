import AsyncStorage from '@react-native-async-storage/async-storage';

import { AsyncStorageDataSourcePreference } from '../AsyncStorageDataSourcePreference';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => jest.clearAllMocks());

describe('AsyncStorageDataSourcePreference', () => {
  it('loads a persisted source using the dedicated storage key', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('gitlab');

    await expect(new AsyncStorageDataSourcePreference().load()).resolves.toBe('gitlab');
    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@github_explorer/data_source');
  });

  it('returns null for an unsupported stored value', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('bitbucket');

    await expect(new AsyncStorageDataSourcePreference().load()).resolves.toBeNull();
  });

  it('saves the source using the dedicated storage key', async () => {
    await new AsyncStorageDataSourcePreference().save('github');

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@github_explorer/data_source', 'github');
  });
});
