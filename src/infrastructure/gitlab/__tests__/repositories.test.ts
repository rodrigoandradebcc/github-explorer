import type { GitLabIssueDto, GitLabProjectDetailsDto } from '../dtos';
import type { GitLabIssueDataSource } from '../GitLabIssueDataSource';
import { GitLabIssueRepository } from '../GitLabIssueRepository';
import type { GitLabRepositoryDataSource } from '../GitLabRepositoryDataSource';
import { GitLabRepositoryRepository } from '../GitLabRepositoryRepository';

function fakeRepositoryDataSource(
  overrides: Partial<GitLabRepositoryDataSource> = {},
): GitLabRepositoryDataSource {
  return { searchProjects: jest.fn(), getProject: jest.fn(), ...overrides };
}

function fakeIssueDataSource(
  overrides: Partial<GitLabIssueDataSource> = {},
): GitLabIssueDataSource {
  return { listOpenIssues: jest.fn(), ...overrides };
}

const mockProject: GitLabProjectDetailsDto = {
  id: 42,
  name: 'GitLab FOSS',
  path: 'gitlab-foss',
  path_with_namespace: 'gitlab-org/gitlab-foss',
  description: 'GitLab Community Edition',
  web_url: 'https://gitlab.com/gitlab-org/gitlab-foss',
  avatar_url: null,
  star_count: 2600,
  forks_count: 1100,
  open_issues_count: 300,
  topics: ['git', 'devops'],
  last_activity_at: '2024-02-01T00:00:00Z',
  created_at: '2011-10-09T00:00:00Z',
  visibility: 'public',
  default_branch: 'master',
  namespace: {
    id: 9970,
    name: 'GitLab.org',
    path: 'gitlab-org',
    kind: 'group',
    full_path: 'gitlab-org',
    avatar_url: '/uploads/-/system/group/avatar/9970/logo.png',
    web_url: 'https://gitlab.com/groups/gitlab-org',
  },
};

const mockIssue: GitLabIssueDto = {
  id: 501,
  iid: 7,
  title: 'Pipeline fails on retry',
  description: 'Details of the failure',
  state: 'opened',
  author: {
    id: 3,
    username: 'jane',
    name: 'Jane Doe',
    avatar_url: 'https://gitlab.com/uploads/user/avatar/3/avatar.png',
    web_url: 'https://gitlab.com/jane',
  },
  labels: ['bug', 'ci'],
  user_notes_count: 4,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  closed_at: null,
  web_url: 'https://gitlab.com/gitlab-org/gitlab-foss/-/issues/7',
};

describe('GitLabRepositoryRepository', () => {
  it('maps projects to source-agnostic entities and reads pagination from headers', async () => {
    const dataSource = fakeRepositoryDataSource({
      searchProjects: jest.fn().mockResolvedValue({
        items: [mockProject],
        totalHeader: '55',
        nextPageHeader: '3',
      }),
    });

    const result = await new GitLabRepositoryRepository(dataSource).search('gitlab', 2);

    expect(dataSource.searchProjects).toHaveBeenCalledWith('gitlab', 2);
    expect(result.total).toBe(55);
    expect(result.nextPage).toBe(3);
    expect(result.items[0]).toMatchObject({
      id: 42,
      name: 'gitlab-foss',
      fullName: 'gitlab-org/gitlab-foss',
      language: null,
      isPrivate: false,
      topics: ['git', 'devops'],
      owner: {
        login: 'gitlab-org',
        type: 'organization',
        avatarUrl: 'https://gitlab.com/uploads/-/system/group/avatar/9970/logo.png',
        profileUrl: 'https://gitlab.com/groups/gitlab-org',
      },
    });
    expect(result.items[0]?.createdAt).toEqual(new Date('2011-10-09T00:00:00Z'));
  });

  it('ends pagination and total when GitLab omits the headers', async () => {
    const dataSource = fakeRepositoryDataSource({
      searchProjects: jest.fn().mockResolvedValue({
        items: [mockProject],
        totalHeader: null,
        nextPageHeader: null,
      }),
    });

    const result = await new GitLabRepositoryRepository(dataSource).search('gitlab', 1);

    expect(result.total).toBeNull();
    expect(result.nextPage).toBeNull();
  });

  it('loads details by full path and marks source-missing stats as null', async () => {
    const dataSource = fakeRepositoryDataSource({
      getProject: jest.fn().mockResolvedValue(mockProject),
    });

    const result = await new GitLabRepositoryRepository(dataSource).findByOwnerAndName(
      'gitlab-org',
      'gitlab-foss',
    );

    expect(dataSource.getProject).toHaveBeenCalledWith('gitlab-org/gitlab-foss');
    expect(result).toMatchObject({
      watchersCount: null,
      subscribersCount: null,
      networkCount: null,
      size: null,
      defaultBranch: 'master',
      license: null,
    });
    expect(result.pushedAt).toEqual(new Date('2024-02-01T00:00:00Z'));
  });
});

describe('GitLabIssueRepository', () => {
  it('maps GitLab issue vocabulary to the domain contract', async () => {
    const dataSource = fakeIssueDataSource({
      listOpenIssues: jest.fn().mockResolvedValue({
        items: [mockIssue],
        totalHeader: '12',
        nextPageHeader: '4',
      }),
    });

    const result = await new GitLabIssueRepository(dataSource).findOpenByRepository(
      'gitlab-org',
      'gitlab-foss',
      3,
    );

    expect(dataSource.listOpenIssues).toHaveBeenCalledWith('gitlab-org/gitlab-foss', 3);
    expect(result.total).toBe(12);
    expect(result.nextPage).toBe(4);
    expect(result.items[0]).toMatchObject({
      id: 501,
      number: 7,
      state: 'open',
      commentsCount: 4,
      isPullRequest: false,
      author: { login: 'jane', type: 'user' },
      labels: [
        { id: 0, name: 'bug', color: null, description: null },
        { id: 1, name: 'ci', color: null, description: null },
      ],
    });
  });
});
