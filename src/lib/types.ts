
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
  imageUrl?: string;
  votes: number;
  "data-ai-hint"?: string;
};

export type Duel = {
  id: string;
  title: string;
  description: string;
  options: [DuelOption, DuelOption];
  creator: Pick<User, 'name' | 'avatarUrl' | 'id'>;
  type: 'A_VS_B' | 'LIST' | 'KING_OF_THE_HILL';
  status: 'active' | 'closed' | 'scheduled';
  createdAt: string; // ISO 8601 string
  startsAt: string; // ISO 8601 string
  endsAt: string; // ISO 8601 string
};

export type Notification = {
    id: string;
    type: 'duel-closed' | 'duel-edited' | 'duel-reset' | 'winner-changed';
    message: string;
    link: string | null;
    timestamp: string; // ISO 8601 string
    read: boolean;
};

export type KeyTransaction = {
    id: string;
    type: 'earned' | 'spent';
    amount: number;
    description: string;
    timestamp: string; // ISO 8601 string
}
