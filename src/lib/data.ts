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
    title: '¿Cuál es la mejor ciudad futurista?',
    description: 'Vota por tu visión favorita del futuro.',
    options: [
      { id: 'opt-1a', title: 'Metrópolis de Neón', imageUrl: 'https://placehold.co/600x600.png', votes: 120, "data-ai-hint": "futuristic city" },
      { id: 'opt-1b', title: 'Eco-Utopía', imageUrl: 'https://placehold.co/600x600.png', votes: 95, "data-ai-hint": "utopian city" },
    ],
    creator: { id: 'user-2', name: 'SciFiFan', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-2',
    title: 'Criatura Fantástica Favorita',
    description: '¿Qué bestia mágica reina suprema?',
    options: [
      { id: 'opt-2a', title: 'Dragón', imageUrl: 'https://placehold.co/600x600.png', votes: 250, "data-ai-hint": "fantasy dragon" },
      { id: 'opt-2b', title: 'Grifo', imageUrl: 'https://placehold.co/600x600.png', votes: 180, "data-ai-hint": "mythical griffin" },
    ],
    creator: { id: 'user-3', name: 'MythMaster', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-3',
    title: 'Raza de Cachorro más Adorable',
    description: 'Una pregunta muy importante y científica.',
    options: [
      { id: 'opt-3a', title: 'Golden Retriever', imageUrl: 'https://placehold.co/600x600.png', votes: 300, "data-ai-hint": "golden retriever" },
      { id: 'opt-3b', title: 'Corgi', imageUrl: 'https://placehold.co/600x600.png', votes: 350, "data-ai-hint": "corgi puppy" },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-4',
    title: 'Destino de Vacaciones Definitivo',
    description: '¿Relax en la playa o aventura en la montaña?',
    options: [
      { id: 'opt-4a', title: 'Playa Tropical', imageUrl: 'https://placehold.co/600x600.png', votes: 190, "data-ai-hint": "tropical beach" },
      { id: 'opt-4b', title: 'Montañas Nevadas', imageUrl: 'https://placehold.co/600x600.png', votes: 210, "data-ai-hint": "snowy mountains" },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'closed',
  },
  {
    id: 'duel-5',
    title: 'Gatos vs Perros',
    description: 'La eterna pregunta debe ser resuelta.',
    options: [
      { id: 'opt-5a', title: 'Gatos', imageUrl: 'https://placehold.co/600x600.png', votes: 500, "data-ai-hint": "tabby cat" },
      { id: 'opt-5b', title: 'Perros', imageUrl: 'https://placehold.co/600x600.png', votes: 501, "data-ai-hint": "happy dog" },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'closed',
  },
];
