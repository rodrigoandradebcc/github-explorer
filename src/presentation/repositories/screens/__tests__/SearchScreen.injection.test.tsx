import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { RepoService } from '@/application';
import type { Repository } from '@/domain/entities/Repository';
import { renderWithProviders } from '@/presentation/__test-utils__/renderWithProviders';
import { applicationServicesWithRepo } from '@/presentation/di/ApplicationProvider';

import { SearchScreen } from '../SearchScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  Stack: { Screen: () => null },
}));

const injectedRepository: Repository = {
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

    renderWithProviders(<SearchScreen />, {
      services: applicationServicesWithRepo(repositoryService),
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'injected');

    await waitFor(() => {
      expect(screen.getByText('injected-repository')).toBeTruthy();
    });
    expect(search).toHaveBeenCalledWith('injected', 1);
  });
});
