import type { RepositoryDetails } from '@/domain/entities/Repository';
import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';

export interface GetRepoDetailsInput {
  owner: string;
  name: string;
}

export class GetRepoDetailsUseCase {
  constructor(private readonly repositories: RepositoryRepository) {}

  async execute({ owner, name }: GetRepoDetailsInput): Promise<RepositoryDetails> {
    const normalizedOwner = owner.trim();
    const normalizedName = name.trim();

    if (!normalizedOwner) throw new Error('Repository owner is required.');
    if (!normalizedName) throw new Error('Repository name is required.');

    return this.repositories.findByOwnerAndName(normalizedOwner, normalizedName);
  }
}
