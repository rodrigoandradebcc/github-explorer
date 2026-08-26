import { apiClient as githubClient } from '@/infrastructure/github/client';
import type {
  GitHubRepositoryDto,
  GitHubSearchRepositoriesResponseDto,
} from '@/infrastructure/github/dtos';
import { apiClient as gitlabClient } from '@/infrastructure/gitlab/client';
import type { GitLabProjectDto } from '@/infrastructure/gitlab/dtos';

import { dataSourceSelection, issueService, repoService } from '../container';

/**
 * Guards the composition root's registry key mapping: `github` must resolve to the GitHub
 * provider stack and `gitlab` to the GitLab one. Swapping the two keys in `container.ts`
 * type-checks and passes every adapter test, so the only thing that can catch it is driving
 * the real singletons and observing which provider client received the request.
 *
 * This is a wiring test. Mapping and pagination are covered by the adapter tests; the
 * payloads here are the minimum needed to prove a routed result reaches the caller intact.
 */

const githubRepositoryDto: GitHubRepositoryDto = {
  id: 10270250,
  name: 'react',
  full_name: 'facebook/react',
  owner: {
    id: 69631,
    login: 'facebook',
    avatar_url: 'https://example.com/facebook.png',
    html_url: 'https://github.com/facebook',
    type: 'Organization',
  },
  description: 'A declarative UI library',
  html_url: 'https://github.com/facebook/react',
  language: 'JavaScript',
  stargazers_count: 200000,
  forks_count: 40000,
  open_issues_count: 100,
  topics: ['javascript'],
  updated_at: '2024-01-01T00:00:00Z',
  created_at: '2013-05-24T00:00:00Z',
  private: false,
};

const githubSearchResponse: GitHubSearchRepositoriesResponseDto = {
  total_count: 1,
  incomplete_results: false,
  items: [githubRepositoryDto],
};

const gitlabProjectDto: GitLabProjectDto = {
  id: 278964,
  name: 'GitLab',
  path: 'gitlab',
  path_with_namespace: 'gitlab-org/gitlab',
  description: 'GitLab CE',
  web_url: 'https://gitlab.com/gitlab-org/gitlab',
  avatar_url: null,
  star_count: 23000,
  forks_count: 5000,
  last_activity_at: '2024-01-01T00:00:00Z',
  created_at: '2011-01-01T00:00:00Z',
  default_branch: 'master',
  namespace: {
    id: 9970,
    name: 'GitLab.org',
    path: 'gitlab-org',
    kind: 'group',
    full_path: 'gitlab-org',
    avatar_url: null,
    web_url: 'https://gitlab.com/groups/gitlab-org',
  },
};

describe('composition root wiring', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    dataSourceSelection.set('github');
  });

  it('sends repository requests to the client of the selected source and hands its result back', async () => {
    const githubGet = jest
      .spyOn(githubClient, 'get')
      .mockResolvedValue({ data: githubSearchResponse, headers: {} });
    const gitlabGet = jest
      .spyOn(gitlabClient, 'get')
      .mockResolvedValue({ data: [gitlabProjectDto], headers: { 'x-total': '1' } });

    expect(githubClient.defaults.baseURL).toBe('https://api.github.com');
    expect(gitlabClient.defaults.baseURL).toBe('https://gitlab.com/api/v4');

    dataSourceSelection.set('github');
    const githubPage = await repoService.search('react');

    expect(gitlabGet).not.toHaveBeenCalled();
    expect(githubGet).toHaveBeenCalledTimes(1);
    expect(githubGet).toHaveBeenNthCalledWith(1, '/search/repositories', expect.anything());
    // The routed call's return value must reach the caller, not be swallowed.
    expect(githubPage.items.map((repo) => repo.fullName)).toEqual(['facebook/react']);

    dataSourceSelection.set('gitlab');
    const gitlabPage = await repoService.search('react');

    expect(githubGet).toHaveBeenCalledTimes(1);
    expect(gitlabGet).toHaveBeenCalledTimes(1);
    expect(gitlabGet).toHaveBeenNthCalledWith(1, '/projects', expect.anything());
    expect(gitlabPage.items.map((repo) => repo.fullName)).toEqual(['gitlab-org/gitlab']);
  });

  it('sends issue requests to the client of the selected source', async () => {
    const githubGet = jest.spyOn(githubClient, 'get').mockResolvedValue({ data: [], headers: {} });
    const gitlabGet = jest.spyOn(gitlabClient, 'get').mockResolvedValue({ data: [], headers: {} });

    dataSourceSelection.set('github');
    await issueService.listOpen('facebook', 'react');

    expect(gitlabGet).not.toHaveBeenCalled();
    expect(githubGet).toHaveBeenCalledTimes(1);
    expect(githubGet).toHaveBeenNthCalledWith(1, '/repos/facebook/react/issues', expect.anything());

    dataSourceSelection.set('gitlab');
    await issueService.listOpen('gitlab-org', 'gitlab');

    expect(githubGet).toHaveBeenCalledTimes(1);
    expect(gitlabGet).toHaveBeenCalledTimes(1);
    expect(gitlabGet).toHaveBeenNthCalledWith(
      1,
      '/projects/gitlab-org%2Fgitlab/issues',
      expect.anything(),
    );
  });
});
