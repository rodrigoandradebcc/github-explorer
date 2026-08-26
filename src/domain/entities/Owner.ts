export interface Owner {
  id: number;
  login: string;
  avatarUrl: string | null;
  profileUrl: string;
  type: 'user' | 'organization';
}
