import type { RepoRepository } from '@/domain/repositories/RepoRepository';

import { GetRepoDetailsUseCase } from '../GetRepoDetailsUseCase';

function makeRepositoryPort(): jest.Mocked<RepoRepository> {
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

  it('trims the input and forwards the abort signal to the port', async () => {
    const repositories = makeRepositoryPort();
    const { signal } = new AbortController();

    await new GetRepoDetailsUseCase(repositories).execute({
      owner: ' facebook ',
      name: ' react ',
      signal,
    });

    expect(repositories.findByOwnerAndName).toHaveBeenCalledWith('facebook', 'react', { signal });
  });
});
