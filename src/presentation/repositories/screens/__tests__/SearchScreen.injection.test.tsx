import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { RepoService } from '@/application';
import type { Repo } from '@/domain/entities/Repo';
import { renderWithProviders } from '@/presentation/__test-utils__/renderWithProviders';

import { SearchScreen } from '../SearchScreen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));

const injectedRepository: Repo = {
  id: 42,
  name: 'injected-repository',
  fullName: 'example/injected-repository',
  owner: {
    id: 1,
    login: 'example',
    avatarUrl: 'https://example.com/avatar.png',
    profileUrl: 'https://github.com/example',
    type: 'organization',
  },
  description: 'Loaded through an injected RepoService',
  url: 'https://github.com/example/injected-repository',
  language: 'TypeScript',
  starsCount: 10,
  forksCount: 2,
  openIssuesCount: 1,
  topics: [],
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdAt: new Date('2024-01-01T00:00:00Z'),
  isPrivate: false,
};

describe('SearchScreen service injection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders repositories returned by the injected RepoService', async () => {
    const search = jest.fn().mockResolvedValue({
      items: [injectedRepository],
      total: 1,
      nextPage: null,
    });
    const repositoryService = {
      search,
      details: jest.fn(),
    } as unknown as RepoService;

    renderWithProviders(<SearchScreen />, { services: { repoService: repositoryService } });
    fireEvent.changeText(screen.getByTestId('search-input'), 'injected');

    await waitFor(() => {
      expect(screen.getByText('injected-repository')).toBeTruthy();
    });
    expect(search).toHaveBeenCalledWith('injected', 1, { signal: expect.any(AbortSignal) });
  });

  it('refetches through the same injected service when the source switches', async () => {
    const search = jest.fn().mockResolvedValue({
      items: [injectedRepository],
      total: 1,
      nextPage: null,
    });
    const repositoryService = { search, details: jest.fn() } as unknown as RepoService;

    renderWithProviders(<SearchScreen />, { services: { repoService: repositoryService } });
    fireEvent.changeText(screen.getByTestId('search-input'), 'injected');
    await waitFor(() => expect(screen.getByText('injected-repository')).toBeTruthy());
    expect(search).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('data-source-option-gitlab'));

    await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
    expect(search).toHaveBeenNthCalledWith(2, 'injected', 1, {
      signal: expect.any(AbortSignal),
    });
  });

  it('URL-encodes route segments when opening a repository', async () => {
    const nested: Repo = {
      ...injectedRepository,
      owner: { ...injectedRepository.owner, login: 'group/subgroup' },
    };
    const search = jest.fn().mockResolvedValue({ items: [nested], total: 1, nextPage: null });
    const repositoryService = { search, details: jest.fn() } as unknown as RepoService;

    renderWithProviders(<SearchScreen />, { services: { repoService: repositoryService } });
    fireEvent.changeText(screen.getByTestId('search-input'), 'injected');
    await waitFor(() => expect(screen.getByTestId(`repo-card-${nested.id}`)).toBeTruthy());

    fireEvent.press(screen.getByTestId(`repo-card-${nested.id}`));

    expect(mockPush).toHaveBeenCalledWith('/repository/group%2Fsubgroup/injected-repository');
  });
});
