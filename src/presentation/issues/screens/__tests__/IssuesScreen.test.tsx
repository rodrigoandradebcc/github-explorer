import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithProviders } from '@/presentation/__test-utils__/renderWithProviders';
import { useRepoIssues } from '@/presentation/issues/hooks/useRepoIssues';
import type { Issue } from '@/domain/entities/Issue';
import { DataAccessError } from '@/domain/errors/DataAccessError';

import { IssuesScreen } from '../IssuesScreen';

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ owner: 'facebook', repo: 'react' }),
  Stack: { Screen: () => null },
}));

jest.mock('@/presentation/issues/hooks/useRepoIssues');
const mockHook = useRepoIssues as jest.MockedFunction<typeof useRepoIssues>;

// ── helpers ───────────────────────────────────────────────────────────────────

const makeIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: 1,
  number: 1,
  title: 'Fix memory leak in useEffect',
  body: null,
  state: 'open',
  author: {
    id: 1,
    login: 'torvalds',
    avatarUrl: 'https://example.com/avatar.png',
    profileUrl: 'https://github.com/torvalds',
    type: 'user',
  },
  labels: [],
  commentsCount: 0,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  closedAt: null,
  url: 'https://github.com/facebook/react/issues/1',
  isPullRequest: false,
  ...overrides,
});

function withData(overrides: Partial<ReturnType<typeof useRepoIssues>> = {}) {
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
  } as unknown as ReturnType<typeof useRepoIssues>);
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  withData();
});

describe('IssuesScreen', () => {
  it('shows skeleton while loading', () => {
    withData({ isLoading: true });
    renderWithProviders(<IssuesScreen />);
    expect(screen.getByTestId('issues-skeleton')).toBeTruthy();
  });

  it('shows generic error with retry button', () => {
    withData({ isError: true, error: new Error('Network error') });
    renderWithProviders(<IssuesScreen />);
    expect(screen.getByTestId('issues-error')).toBeTruthy();
    expect(screen.getByTestId('issues-retry-button')).toBeTruthy();
  });

  it('shows rate-limit error with token hint', () => {
    withData({
      isError: true,
      error: new DataAccessError('rateLimit', 'rate limit exceeded'),
    });
    renderWithProviders(<IssuesScreen />);
    expect(screen.getByTestId('issues-error')).toBeTruthy();
    expect(screen.getByText(/token de acesso/)).toBeTruthy();
    expect(screen.queryByTestId('issues-retry-button')).toBeNull();
  });

  it('shows empty state when there are no open issues', () => {
    withData({
      data: { pages: [{ items: [], total: null, nextPage: null }], pageParams: [1] },
    });
    renderWithProviders(<IssuesScreen />);
    expect(screen.getByTestId('issues-empty')).toBeTruthy();
  });

  it('offers to keep scanning when the budget ran out before finding an issue', () => {
    const fetchNextPage = jest.fn();
    withData({
      data: { pages: [{ items: [], total: null, nextPage: 6 }], pageParams: [1] },
      hasNextPage: true,
      fetchNextPage,
    });
    renderWithProviders(<IssuesScreen />);

    fireEvent.press(screen.getByTestId('issues-continue-button'));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not offer to keep scanning when the repository truly has no issues', () => {
    withData({
      data: { pages: [{ items: [], total: null, nextPage: null }], pageParams: [1] },
      hasNextPage: false,
    });
    renderWithProviders(<IssuesScreen />);

    expect(screen.getByTestId('issues-empty')).toBeTruthy();
    expect(screen.queryByTestId('issues-continue-button')).toBeNull();
  });

  it('renders issues list when data is available', () => {
    const issues = [
      makeIssue({ id: 1, title: 'Fix memory leak in useEffect' }),
      makeIssue({ id: 2, title: 'Add TypeScript support' }),
    ];
    withData({
      data: { pages: [{ items: issues, total: null, nextPage: null }], pageParams: [1] },
    });
    renderWithProviders(<IssuesScreen />);
    expect(screen.getByTestId('issues-list')).toBeTruthy();
    expect(screen.getByText('Fix memory leak in useEffect')).toBeTruthy();
    expect(screen.getByText('Add TypeScript support')).toBeTruthy();
  });

  it('renders issue labels as badges', () => {
    const issues = [
      makeIssue({
        id: 1,
        labels: [
          { id: 10, name: 'bug', color: 'd73a4a', description: null },
          { id: 11, name: 'good first issue', color: '7057ff', description: null },
        ],
      }),
    ];
    withData({
      data: { pages: [{ items: issues, total: null, nextPage: null }], pageParams: [1] },
    });
    renderWithProviders(<IssuesScreen />);
    expect(screen.getByText('bug')).toBeTruthy();
    expect(screen.getByText('good first issue')).toBeTruthy();
  });
});
