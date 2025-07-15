import type { User, Duel } from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Doe',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop',
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
      { id: 'opt-1a', title: 'Metrópolis de Neón', imageUrl: 'https://images.unsplash.com/photo-1534078362425-387ae9668c15?q=80&w=1935&auto=format&fit=crop', votes: 120, "data-ai-hint": "futuristic city" },
      { id: 'opt-1b', title: 'Eco-Utopía', imageUrl: 'https://images.unsplash.com/photo-1617439587422-5456436a5671?q=80&w=1974&auto=format&fit=crop', votes: 95, "data-ai-hint": "utopian city" },
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
      { id: 'opt-2a', title: 'Dragón', imageUrl: 'https://images.unsplash.com/photo-1627803680284-9a3b64d1845b?q=80&w=1974&auto=format&fit=crop', votes: 250, "data-ai-hint": "fantasy dragon" },
      { id: 'opt-2b', title: 'Grifo', imageUrl: 'https://images.unsplash.com/photo-1632599793189-9430c79b9404?q=80&w=1964&auto=format&fit=crop', votes: 180, "data-ai-hint": "mythical griffin" },
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
      { id: 'opt-3a', title: 'Golden Retriever', imageUrl: 'https://images.unsplash.com/photo-1620189507195-68309c04c4d5?q=80&w=1974&auto=format&fit=crop', votes: 300, "data-ai-hint": "golden retriever" },
      { id: 'opt-3b', title: 'Corgi', imageUrl: 'https://images.unsplash.com/photo-1597633425046-08f5110420b5?q=80&w=1974&auto=format&fit=crop', votes: 350, "data-ai-hint": "corgi puppy" },
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
      { id: 'opt-4a', title: 'Playa Tropical', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723a996f3d4?q=80&w=2070&auto=format&fit=crop', votes: 190, "data-ai-hint": "tropical beach" },
      { id: 'opt-4b', title: 'Montañas Nevadas', imageUrl: 'https://images.unsplash.com/photo-1483728642387-6c351b4013de?q=80&w=2070&auto=format&fit=crop', votes: 210, "data-ai-hint": "snowy mountains" },
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
      { id: 'opt-5a', title: 'Gatos', imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop', votes: 500, "data-ai-hint": "tabby cat" },
      { id: 'opt-5b', title: 'Perros', imageUrl: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?q=80&w=1974&auto=format&fit=crop', votes: 501, "data-ai-hint": "happy dog" },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://placehold.co/40x40.png' },
    type: 'A_VS_B',
    status: 'closed',
  },
];
