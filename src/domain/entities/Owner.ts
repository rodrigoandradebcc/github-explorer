export interface Owner {
  id: number;
  login: string;
  avatarUrl: string;
  profileUrl: string;
  type: 'user' | 'organization';
}
