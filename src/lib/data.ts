import type { User, Duel } from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Doe',
  avatarUrl: 'https://placehold.co/100x100.png',
  keys: 5,
  duelsCreated: 3,
  votesCast: 42,
};

export const mockDuels: Duel[] = [
  {
    id: 'duel-1',
    title: 'Which is the best futuristic city?',
    description: 'Vote for your favorite vision of the future.',
    options: [
      { id: 'opt-1a', title: 'Neon Metropolis', imageUrl: 'https://placehold.co/600x600.png', votes: 120, "data-ai-hint": "futuristic city" },
      { id: 'opt-1b', title: 'Eco-Utopia', imageUrl: 'https://placehold.co/600x600.png', votes: 95, "data-ai-hint": "utopian city" },
    ],
    creator: { name: 'SciFiFan', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-2',
    title: 'Favorite Fantasy Creature',
    description: 'Which magical beast reigns supreme?',
    options: [
      { id: 'opt-2a', title: 'Dragon', imageUrl: 'https://placehold.co/600x600.png', votes: 250, "data-ai-hint": "fantasy dragon" },
      { id: 'opt-2b', title: 'Griffin', imageUrl: 'https://placehold.co/600x600.png', votes: 180, "data-ai-hint": "mythical griffin" },
    ],
    creator: { name: 'MythMaster', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-3',
    title: 'Cutest Puppy Breed',
    description: 'A very important and scientific question.',
    options: [
      { id: 'opt-3a', title: 'Golden Retriever', imageUrl: 'https://placehold.co/600x600.png', votes: 300, "data-ai-hint": "golden retriever" },
      { id: 'opt-3b', title: 'Corgi', imageUrl: 'https://placehold.co/600x600.png', votes: 350, "data-ai-hint": "corgi puppy" },
    ],
    creator: { name: 'DogLover', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-4',
    title: 'Ultimate Vacation Spot',
    description: 'Beach relaxation or mountain adventure?',
    options: [
      { id: 'opt-4a', title: 'Tropical Beach', imageUrl: 'https://placehold.co/600x600.png', votes: 190, "data-ai-hint": "tropical beach" },
      { id: 'opt-4b', title: 'Snowy Mountains', imageUrl: 'https://placehold.co/600x600.png', votes: 210, "data-ai-hint": "snowy mountains" },
    ],
    creator: { name: 'Wanderlust', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'closed',
  },
];
