import type { RepoDetails } from '@/domain/entities/Repo';
import type { RepoRepository } from '@/domain/repositories/RepoRepository';

export interface GetRepoDetailsInput {
  owner: string;
  name: string;
  signal?: AbortSignal;
}

export class GetRepoDetailsUseCase {
  constructor(private readonly repositories: RepoRepository) {}

  async execute({ owner, name, signal }: GetRepoDetailsInput): Promise<RepoDetails> {
    const normalizedOwner = owner.trim();
    const normalizedName = name.trim();

    if (!normalizedOwner) throw new Error('Repository owner is required.');
    if (!normalizedName) throw new Error('Repository name is required.');

    return this.repositories.findByOwnerAndName(normalizedOwner, normalizedName, { signal });
  }
}
