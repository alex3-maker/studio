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
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop',
    keys: 10,
    duelsCreated: 1,
    votesCast: 15,
    role: 'user',
  },
  {
    id: 'user-3',
    name: 'MythMaster',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
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
      { id: 'opt-1a', title: 'Metrópolis de Neón', imageUrl: 'https://images.unsplash.com/photo-1528143358888-6d3c7f67bd5d?q=80&w=1949&auto=format&fit=crop', votes: 120 },
      { id: 'opt-1b', title: 'Eco-Utopía', imageUrl: 'https://images.unsplash.com/photo-1622969428593-13233b20755a?q=80&w=2070&auto=format&fit=crop', votes: 95 },
    ],
    creator: { id: 'user-2', name: 'SciFiFan', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-2',
    title: 'Criatura Fantástica Favorita',
    description: '¿Qué bestia mágica reina suprema?',
    options: [
      { id: 'opt-2a', title: 'Dragón', imageUrl: 'https://images.unsplash.com/photo-1550100136-7013894a8893?q=80&w=2070&auto=format&fit=crop', votes: 250 },
      { id: 'opt-2b', title: 'Grifo', imageUrl: 'https://images.unsplash.com/photo-1618585478493-80885938f28c?q=80&w=1939&auto=format&fit=crop', votes: 180 },
    ],
    creator: { id: 'user-3', name: 'MythMaster', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop' },
    type: 'A_VS_B',
    status: 'active',
  },
  {
    id: 'duel-3',
    title: 'Raza de Cachorro más Adorable',
    description: 'Una pregunta muy importante y científica.',
    options: [
      { id: 'opt-3a', title: 'Golden Retriever', imageUrl: 'https://images.unsplash.com/photo-1611250188496-e968032a4d38?q=80&w=1974&auto=format&fit=crop', votes: 300 },
      { id: 'opt-3b', title: 'Corgi', imageUrl: 'https://images.unsplash.com/photo-1548548325-045a57a092c2?q=80&w=2070&auto=format&fit=crop', votes: 350 },
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
      { id: 'opt-4a', title: 'Playa Tropical', imageUrl: 'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?q=80&w=2070&auto=format&fit=crop', votes: 190 },
      { id: 'opt-4b', title: 'Montañas Nevadas', imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2070&auto=format&fit=crop', votes: 210 },
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
      { id: 'opt-5a', title: 'Gatos', imageUrl: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?q=80&w=1964&auto=format&fit=crop', votes: 500 },
      { id: 'opt-5b', title: 'Perros', imageUrl: 'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?q=80&w=1976&auto=format&fit=crop', votes: 501 },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' },
    type: 'A_VS_B',
    status: 'closed',
  },
];
