export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  keys: number;
  duelsCreated: number;
  votesCast: number;
  role: 'admin' | 'user';
};

export type DuelOption = {
  id: string;
  title: string;
  imageUrl: string;
  votes: number;
};

export type Duel = {
  id: string;
  title: string;
  description: string;
  options: [DuelOption, DuelOption];
  creator: Pick<User, 'name' | 'avatarUrl' | 'id'>;
  type: 'A_VS_B' | 'LIST' | 'KING_OF_THE_HILL';
  status: 'active' | 'closed';
};
