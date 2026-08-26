import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';

import { SearchReposUseCase } from '../SearchReposUseCase';

function makeRepositoryPort(): jest.Mocked<RepositoryRepository> {
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
    expect(repositories.search).toHaveBeenCalledWith('react', 2);
  });
});
