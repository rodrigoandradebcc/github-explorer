import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { renderWithProviders } from '@/presentation/__test-utils__/renderWithProviders';
import { useSearchRepos } from '@/presentation/repositories/hooks/useSearchRepos';
import type { Repo } from '@/domain/entities/Repo';
import { DataAccessError } from '@/domain/errors/DataAccessError';

import { SearchScreen } from '../SearchScreen';

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock('@/presentation/repositories/hooks/useSearchRepos');

const mockHook = useSearchRepos as jest.MockedFunction<typeof useSearchRepos>;

// ── helpers ───────────────────────────────────────────────────────────────────

const makeRepo = (overrides: Partial<Repo> = {}): Repo => ({
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
  ...overrides,
});

function idleHook(overrides = {}) {
  mockHook.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
    isRefetching: false,
    ...overrides,
  } as unknown as ReturnType<typeof useSearchRepos>);
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  idleHook();
});

describe('SearchScreen', () => {
  it('renders the search input', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByTestId('search-input')).toBeTruthy();
  });

  it('shows the empty prompt when no query is typed', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByTestId('empty-prompt')).toBeTruthy();
  });

  it('shows skeletons during initial loading', async () => {
    idleHook({ isLoading: true, data: undefined });

    renderWithProviders(<SearchScreen />);

    // Simulate typing to set a debouncedQuery — but since debounce is 500ms
    // and loading=true, after the debounce fires the skeletons should appear.
    // We advance by triggering the hook directly via the isLoading flag.
    // The skeleton should be visible once query is set + isLoading = true.
    fireEvent.changeText(screen.getByTestId('search-input'), 'react');

    await waitFor(() => {
      expect(screen.getAllByTestId(/repo-card-skeleton/).length).toBeGreaterThan(0);
    });
  });

  it('renders repository list when data is available', async () => {
    const repos = [makeRepo({ id: 1 }), makeRepo({ id: 2, name: 'redux' })];
    idleHook({
      data: {
        pages: [{ total: 2, nextPage: null, items: repos }],
        pageParams: [1],
      },
    });

    renderWithProviders(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'react');

    await waitFor(() => {
      expect(screen.getByTestId('repos-list')).toBeTruthy();
    });
  });

  it('shows empty-results message when query returns no items', async () => {
    idleHook({
      data: { pages: [{ total: 0, nextPage: null, items: [] }], pageParams: [1] },
    });

    renderWithProviders(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'xyznothing123');

    await waitFor(() => {
      expect(screen.getByTestId('empty-results')).toBeTruthy();
    });
  });

  it('shows rate-limit error with token hint', async () => {
    const rateLimitErr = new DataAccessError('rateLimit', 'rate limit exceeded');
    idleHook({ isError: true, error: rateLimitErr });

    renderWithProviders(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'react');

    await waitFor(() => {
      expect(screen.getByTestId('rate-limit-error')).toBeTruthy();
      expect(screen.getByText(/token de acesso/)).toBeTruthy();
    });
  });

  it('shows generic error with retry button', async () => {
    const genericErr = new Error('Network Error');
    idleHook({ isError: true, error: genericErr });

    renderWithProviders(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'react');

    await waitFor(() => {
      expect(screen.getByTestId('generic-error')).toBeTruthy();
      expect(screen.getByText('Tentar novamente')).toBeTruthy();
    });
  });

  it('calls refetch when retry button is pressed', async () => {
    const refetch = jest.fn();
    idleHook({ isError: true, error: new Error('fail'), refetch });

    renderWithProviders(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'react');

    await waitFor(() => screen.getByText('Tentar novamente'));
    fireEvent.press(screen.getByText('Tentar novamente'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
