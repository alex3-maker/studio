import type { User, Duel } from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Doe',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop',
  keys: 6,
  duelsCreated: 3,
  votesCast: 42,
  role: 'admin',
};

export const mockUsers: User[] = [
  mockUser,
  {
    id: 'user-2',
    name: 'SciFiFan',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
    keys: 10,
    duelsCreated: 1,
    votesCast: 15,
    role: 'user',
  },
  {
    id: 'user-3',
    name: 'MythMaster',
    avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop',
    keys: 2,
    duelsCreated: 1,
    votesCast: 22,
    role: 'user',
  },
]

export const mockDuels: Duel[] = [
  {
    id: 'duel-1',
    title: '¿Cuál es la mejor ciudad futurista?',
    description: 'Vota por tu visión favorita del futuro.',
    options: [
      { id: 'opt-1a', title: 'Metrópolis de Neón', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'neon metropolis', votes: 120 },
      { id: 'opt-1b', title: 'Eco-Utopía', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'eco utopia', votes: 95 },
    ],
    creator: { id: 'user-2', name: 'SciFiFan', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-2',
    title: 'Criatura Fantástica Favorita',
    description: '¿Qué bestia mágica reina suprema?',
    options: [
      { id: 'opt-2a', title: 'Dragón', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'dragon fantasy', votes: 250 },
      { id: 'opt-2b', title: 'Grifo', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'griffin fantasy', votes: 180 },
    ],
    creator: { id: 'user-3', name: 'MythMaster', avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-3',
    title: 'Raza de Cachorro más Adorable',
    description: 'Una pregunta muy importante y científica.',
    options: [
      { id: 'opt-3a', title: 'Golden Retriever', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'golden retriever', votes: 300 },
      { id: 'opt-3b', title: 'Corgi', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'corgi puppy', votes: 350 },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-4',
    title: 'Destino de Vacaciones Definitivo',
    description: '¿Relax en la playa o aventura en la montaña?',
    options: [
      { id: 'opt-4a', title: 'Playa Tropical', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'tropical beach', votes: 190 },
      { id: 'opt-4b', title: 'Montañas Nevadas', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'snowy mountains', votes: 210 },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' },
    type: 'A_VS_B',
    status: 'closed',
  },
  {
    id: 'duel-5',
    title: 'Gatos vs Perros',
    description: 'La eterna pregunta debe ser resuelta.',
    options: [
      { id: 'opt-5a', title: 'Gatos', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'cat portrait', votes: 500 },
      { id: 'opt-5b', title: 'Perros', imageUrl: 'https://placehold.co/600x600.png', 'data-ai-hint': 'dog portrait', votes: 501 },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' },
    type: 'A_VS_B',
    status: 'closed',
  },
];
