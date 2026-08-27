import type { RepoRepository } from '@/domain/repositories/RepoRepository';

import { SearchReposUseCase } from '../SearchReposUseCase';

function makeRepositoryPort(): jest.Mocked<RepoRepository> {
  return {
    search: jest.fn(),
    findByOwnerAndName: jest.fn(),
  };
}

describe('SearchReposUseCase', () => {
  it.each(['', '   '])('does not call the port for an empty query (%p)', async (query) => {
    const repositories = makeRepositoryPort();
    const useCase = new SearchReposUseCase(repositories);

    await expect(useCase.execute({ query })).resolves.toEqual({
      items: [],
      total: 0,
      nextPage: null,
    });
    expect(repositories.search).not.toHaveBeenCalled();
  });

  it('normalizes the query and delegates pagination to the port', async () => {
    const repositories = makeRepositoryPort();
    const result = { items: [], total: 0, nextPage: null };
    repositories.search.mockResolvedValue(result);
    const useCase = new SearchReposUseCase(repositories);

    await expect(useCase.execute({ query: '  react  ', page: 2 })).resolves.toBe(result);
    expect(repositories.search).toHaveBeenCalledWith('react', 2, { signal: undefined });
  });

  it('forwards the caller abort signal to the port', async () => {
    const repositories = makeRepositoryPort();
    repositories.search.mockResolvedValue({ items: [], total: 0, nextPage: null });
    const { signal } = new AbortController();

    await new SearchReposUseCase(repositories).execute({ query: 'react', signal });

    expect(repositories.search).toHaveBeenCalledWith('react', 1, { signal });
  });
});
