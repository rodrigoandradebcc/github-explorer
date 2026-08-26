import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';

import type { DataSourceRegistry } from '../DataSourceRegistry';
import { SourceRoutedIssueRepository } from '../SourceRoutedIssueRepository';
import { SourceRoutedRepositoryRepository } from '../SourceRoutedRepositoryRepository';

const emptyPage = { items: [], total: null, nextPage: null };

function fakeRegistry(): DataSourceRegistry {
  const repositories = (): jest.Mocked<RepositoryRepository> => ({
    search: jest.fn().mockResolvedValue(emptyPage),
    findByOwnerAndName: jest.fn(),
  });
  const issues = (): jest.Mocked<IssueRepository> => ({
    findOpenByRepository: jest.fn().mockResolvedValue(emptyPage),
  });
  return {
    github: { repositories: repositories(), issues: issues() },
    gitlab: { repositories: repositories(), issues: issues() },
  };
}

describe('SourceRoutedRepositoryRepository', () => {
  it('delegates to the active source and follows a runtime switch per call', async () => {
    const registry = fakeRegistry();
    const selection = new DataSourceSelection('github');
    const routed = new SourceRoutedRepositoryRepository(registry, () => selection.current);

    await routed.search('react', 2);
    expect(registry.github.repositories.search).toHaveBeenCalledWith('react', 2);
    expect(registry.gitlab.repositories.search).not.toHaveBeenCalled();

    selection.set('gitlab');

    await routed.search('react', 1);
    await routed.findByOwnerAndName('gitlab-org', 'gitlab-foss');
    expect(registry.gitlab.repositories.search).toHaveBeenCalledWith('react', 1);
    expect(registry.gitlab.repositories.findByOwnerAndName).toHaveBeenCalledWith(
      'gitlab-org',
      'gitlab-foss',
    );
    expect(registry.github.repositories.search).toHaveBeenCalledTimes(1);
  });
});

describe('SourceRoutedIssueRepository', () => {
  it('delegates to the active source per call', async () => {
    const registry = fakeRegistry();
    const selection = new DataSourceSelection('gitlab');
    const routed = new SourceRoutedIssueRepository(registry, () => selection.current);

    await routed.findOpenByRepository('gitlab-org', 'gitlab-foss', 5);
    expect(registry.gitlab.issues.findOpenByRepository).toHaveBeenCalledWith(
      'gitlab-org',
      'gitlab-foss',
      5,
    );

    selection.set('github');

    await routed.findOpenByRepository('facebook', 'react', 1);
    expect(registry.github.issues.findOpenByRepository).toHaveBeenCalledWith(
      'facebook',
      'react',
      1,
    );
  });
});
