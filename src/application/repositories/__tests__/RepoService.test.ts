import type { RepoRepository } from '@/domain/repositories/RepoRepository';

import { GetRepoDetailsUseCase } from '../GetRepoDetailsUseCase';
import { RepoService } from '../RepoService';
import { SearchReposUseCase } from '../SearchReposUseCase';

function makeRepoPort(): jest.Mocked<RepoRepository> {
  return { search: jest.fn(), findByOwnerAndName: jest.fn() };
}

function makeService(repos: jest.Mocked<RepoRepository>) {
  return new RepoService(new SearchReposUseCase(repos), new GetRepoDetailsUseCase(repos));
}

describe('RepoService', () => {
  it('defaults to the first page and no signal when the caller omits both', async () => {
    const repos = makeRepoPort();
    repos.search.mockResolvedValue({ items: [], total: 0, nextPage: null });

    await makeService(repos).search('react');

    expect(repos.search).toHaveBeenCalledWith('react', 1, { signal: undefined });
  });

  it('carries page and abort signal into the search use case input', async () => {
    const repos = makeRepoPort();
    repos.search.mockResolvedValue({ items: [], total: 0, nextPage: null });
    const { signal } = new AbortController();

    await makeService(repos).search('react', 3, { signal });

    expect(repos.search).toHaveBeenCalledWith('react', 3, { signal });
  });

  it('carries the abort signal into the details use case input', async () => {
    const repos = makeRepoPort();
    const { signal } = new AbortController();

    await makeService(repos).details('facebook', 'react', { signal });

    expect(repos.findByOwnerAndName).toHaveBeenCalledWith('facebook', 'react', { signal });
  });
});
