import type { Issue } from './Issue';

export function isPullRequest(issue: Issue): boolean {
  return issue.isPullRequest;
}
