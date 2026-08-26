import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithProviders } from '@/presentation/__test-utils__/renderWithProviders';
import { useRepoDetails } from '@/presentation/repositories/hooks/useRepoDetails';
import type { RepositoryDetails } from '@/domain/entities/Repository';
import { DataAccessError } from '@/domain/errors/DataAccessError';

import { RepositoryDetailScreen } from '../RepositoryDetailScreen';

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ owner: 'facebook', repo: 'react' }),
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));

jest.mock('@/presentation/repositories/hooks/useRepoDetails');
const mockHook = useRepoDetails as jest.MockedFunction<typeof useRepoDetails>;

// ── helpers ───────────────────────────────────────────────────────────────────

const makeDetail = (overrides: Partial<RepositoryDetails> = {}): RepositoryDetails => ({
  id: 1,
  name: 'react',
  fullName: 'facebook/react',
  owner: {
    id: 1,
    login: 'facebook',
    avatarUrl: 'https://example.com/avatar.png',
    profileUrl: 'https://github.com/facebook',
    type: 'organization',
  },
  description: 'A declarative UI library',
  url: 'https://github.com/facebook/react',
  language: 'JavaScript',
  starsCount: 200000,
  forksCount: 40000,
  openIssuesCount: 100,
  topics: [],
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdAt: new Date('2013-05-24T00:00:00Z'),
  isPrivate: false,
  watchersCount: 200000,
  subscribersCount: 10000,
  networkCount: 40000,
  size: 1000,
  defaultBranch: 'main',
  license: null,
  pushedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

function withData(overrides: Partial<ReturnType<typeof useRepoDetails>> = {}) {
  mockHook.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useRepoDetails>);
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  withData();
});

describe('RepositoryDetailScreen', () => {
  it('does not render content cards while loading', () => {
    withData({ isLoading: true });
    renderWithProviders(<RepositoryDetailScreen />);
    expect(screen.queryByTestId('repo-detail-header')).toBeNull();
    expect(screen.queryByTestId('repo-detail-stats')).toBeNull();
  });

  it('shows generic error with retry button', () => {
    withData({ isError: true, error: new Error('Network error') });
    renderWithProviders(<RepositoryDetailScreen />);
    expect(screen.getByTestId('detail-error')).toBeTruthy();
    expect(screen.getByTestId('detail-retry-button')).toBeTruthy();
  });

  it('calls refetch when retry button is pressed', () => {
    const refetch = jest.fn();
    withData({ isError: true, error: new Error('fail'), refetch });
    renderWithProviders(<RepositoryDetailScreen />);
    fireEvent.press(screen.getByTestId('detail-retry-button'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows rate-limit error with token hint', () => {
    withData({
      isError: true,
      error: new DataAccessError('rateLimit', 'rate limit'),
    });
    renderWithProviders(<RepositoryDetailScreen />);
    expect(screen.getByTestId('detail-error')).toBeTruthy();
    expect(screen.getByText(/token de acesso/)).toBeTruthy();
    expect(screen.queryByTestId('detail-retry-button')).toBeNull();
  });

  it('renders repository header and stats when data loads', () => {
    withData({ data: makeDetail() });
    renderWithProviders(<RepositoryDetailScreen />);
    expect(screen.getByTestId('repo-detail-header')).toBeTruthy();
    expect(screen.getByTestId('repo-detail-stats')).toBeTruthy();
    expect(screen.getByText('react')).toBeTruthy();
    expect(screen.getByText('facebook')).toBeTruthy();
    expect(screen.getByText('A declarative UI library')).toBeTruthy();
  });

  it('omits description when null', () => {
    withData({ data: makeDetail({ description: null }) });
    renderWithProviders(<RepositoryDetailScreen />);
    expect(screen.queryByText('A declarative UI library')).toBeNull();
  });

  it('navigates to issues when "Ver Issues" is pressed', () => {
    withData({ data: makeDetail() });
    renderWithProviders(<RepositoryDetailScreen />);
    fireEvent.press(screen.getByTestId('view-issues-button'));
    expect(mockPush).toHaveBeenCalledWith('/repository/facebook/react/issues');
  });

  it('omits the watchers stat when the source does not provide it', () => {
    withData({ data: makeDetail({ watchersCount: null }) });
    renderWithProviders(<RepositoryDetailScreen />);
    expect(screen.queryByText('Watchers')).toBeNull();
  });
});
