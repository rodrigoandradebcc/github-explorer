import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { RepoRepository } from '@/domain/repositories/RepoRepository';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';

import type { DataSourceRegistry } from '../DataSourceRegistry';
import { SourceRoutedIssueRepository } from '../SourceRoutedIssueRepository';
import { SourceRoutedRepoRepository } from '../SourceRoutedRepoRepository';

const emptyPage = { items: [], total: null, nextPage: null };

function fakeRegistry(): DataSourceRegistry {
  const repos = (): jest.Mocked<RepoRepository> => ({
    search: jest.fn().mockResolvedValue(emptyPage),
    findByOwnerAndName: jest.fn(),
  });
  const issues = (): jest.Mocked<IssueRepository> => ({
    findOpenByRepository: jest.fn().mockResolvedValue(emptyPage),
  });
  return {
    github: { repos: repos(), issues: issues() },
    gitlab: { repos: repos(), issues: issues() },
  };
}

describe('SourceRoutedRepoRepository', () => {
  it('delegates to the active source and follows a runtime switch per call', async () => {
    const registry = fakeRegistry();
    const selection = new DataSourceSelection('github');
    const routed = new SourceRoutedRepoRepository(registry, () => selection.current);

    await routed.search('react', 2);
    expect(registry.github.repos.search).toHaveBeenCalledWith('react', 2, undefined);
    expect(registry.gitlab.repos.search).not.toHaveBeenCalled();

    selection.set('gitlab');

    const { signal } = new AbortController();

    await routed.search('react', 1, { signal });
    await routed.findByOwnerAndName('gitlab-org', 'gitlab-foss', { signal });
    expect(registry.gitlab.repos.search).toHaveBeenCalledWith('react', 1, { signal });
    expect(registry.gitlab.repos.findByOwnerAndName).toHaveBeenCalledWith(
      'gitlab-org',
      'gitlab-foss',
      { signal },
    );
    expect(registry.github.repos.search).toHaveBeenCalledTimes(1);
  });
});

describe('SourceRoutedIssueRepository', () => {
  it('delegates to the active source per call', async () => {
    const registry = fakeRegistry();
    const selection = new DataSourceSelection('gitlab');
    const routed = new SourceRoutedIssueRepository(registry, () => selection.current);

    const { signal } = new AbortController();

    await routed.findOpenByRepository('gitlab-org', 'gitlab-foss', 5, { signal });
    expect(registry.gitlab.issues.findOpenByRepository).toHaveBeenCalledWith(
      'gitlab-org',
      'gitlab-foss',
      5,
      { signal },
    );

    selection.set('github');

    await routed.findOpenByRepository('facebook', 'react', 1);
    expect(registry.github.issues.findOpenByRepository).toHaveBeenCalledWith(
      'facebook',
      'react',
      1,
      undefined,
    );
  });
});
