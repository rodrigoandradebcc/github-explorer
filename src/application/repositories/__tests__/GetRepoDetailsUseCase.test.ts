import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';

import { GetRepoDetailsUseCase } from '../GetRepoDetailsUseCase';

function makeRepositoryPort(): jest.Mocked<RepositoryRepository> {
  return {
    search: jest.fn(),
    findByOwnerAndName: jest.fn(),
  };
}

describe('GetRepoDetailsUseCase', () => {
  it('rejects an empty owner without calling the port', async () => {
    const repositories = makeRepositoryPort();
    const useCase = new GetRepoDetailsUseCase(repositories);

    await expect(useCase.execute({ owner: ' ', name: 'react' })).rejects.toThrow(
      'Repository owner is required.',
    );
    expect(repositories.findByOwnerAndName).not.toHaveBeenCalled();
  });

  it('rejects an empty repository name without calling the port', async () => {
    const repositories = makeRepositoryPort();
    const useCase = new GetRepoDetailsUseCase(repositories);

    await expect(useCase.execute({ owner: 'facebook', name: '' })).rejects.toThrow(
      'Repository name is required.',
    );
    expect(repositories.findByOwnerAndName).not.toHaveBeenCalled();
  });
});
