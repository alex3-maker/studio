
import type { User, Duel } from './types';
import { subDays, addDays, formatISO } from 'date-fns';

const now = new Date();

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Doe',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop',
  keys: 5,
  duelsCreated: 3,
  votesCast: 42,
  role: 'admin',
  createdAt: formatISO(subDays(now, 30)),
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
    createdAt: formatISO(subDays(now, 25)),
  },
  {
    id: 'user-3',
    name: 'MythMaster',
    avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop',
    keys: 2,
    duelsCreated: 1,
    votesCast: 22,
    role: 'user',
    createdAt: formatISO(subDays(now, 18)),
  },
]

export const mockDuels: Duel[] = [
  {
    id: 'duel-1',
    title: '¿Cuál es la mejor ciudad futurista?',
    description: 'Vota por tu visión favorita del futuro.',
    options: [
      { id: 'opt-1a', title: 'Metrópolis de Neón', imageUrl: 'https://placehold.co/600x600/1e293b/ffffff.png', 'data-ai-hint': 'neon metropolis', votes: 120 },
      { id: 'opt-1b', title: 'Eco-Utopía', imageUrl: 'https://placehold.co/600x600/166534/ffffff.png', 'data-ai-hint': 'eco utopia', votes: 95 },
    ],
    creator: { id: 'user-2', name: 'SciFiFan', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop' },
    status: 'active',
    createdAt: formatISO(subDays(now, 2)),
    startsAt: formatISO(subDays(now, 2)),
    endsAt: formatISO(addDays(now, 5)),
  },
  {
    id: 'duel-6',
    title: '¿Mejor Consola de la Historia?',
    description: 'De todas las consolas que han existido, ¿cuál ha dejado la mayor huella?',
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' },
    status: 'active',
    createdAt: formatISO(subDays(now, 1)),
    startsAt: formatISO(subDays(now, 1)),
    endsAt: formatISO(addDays(now, 12)),
    options: [
      { id: 'opt-6a', title: 'PlayStation 2', imageUrl: 'https://placehold.co/100x100/1f2937/ffffff.png', 'data-ai-hint': 'playstation console', votes: 155 },
      { id: 'opt-6b', title: 'Super Nintendo (SNES)', imageUrl: 'https://placehold.co/100x100/4b5563/ffffff.png', 'data-ai-hint': 'nintendo console', votes: 180 },
      { id: 'opt-6c', title: 'Nintendo 64', imageUrl: 'https://placehold.co/100x100/6b7280/ffffff.png', 'data-ai-hint': 'nintendo 64', votes: 120 },
      { id: 'opt-6d', title: 'Xbox 360', imageUrl: 'https://placehold.co/100x100/166534/ffffff.png', 'data-ai-hint': 'xbox console', votes: 140 },
      { id: 'opt-6e', title: 'Nintendo Switch', imageUrl: 'https://placehold.co/100x100/dc2626/ffffff.png', 'data-ai-hint': 'switch console', votes: 210 },
    ],
  },
  {
    id: 'duel-2',
    title: 'Criatura Fantástica Favorita',
    description: '¿Qué bestia mágica reina suprema?',
    options: [
      { id: 'opt-2a', title: 'Dragón', imageUrl: 'https://placehold.co/600x600/7f1d1d/ffffff.png', 'data-ai-hint': 'dragon fantasy', votes: 250 },
      { id: 'opt-2b', title: 'Grifo', imageUrl: 'https://placehold.co/600x600/a16207/ffffff.png', 'data-ai-hint': 'griffin fantasy', votes: 180 },
    ],
    creator: { id: 'user-3', name: 'MythMaster', avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop' },
    status: 'active',
    createdAt: formatISO(subDays(now, 1)),
    startsAt: formatISO(subDays(now, 1)),
    endsAt: formatISO(addDays(now, 10)),
  },
  {
    id: 'duel-3',
    title: 'Raza de Cachorro más Adorable',
    description: 'Una pregunta muy importante y científica.',
    options: [
      { id: 'opt-3a', title: 'Golden Retriever', imageUrl: 'https://placehold.co/600x600/f59e0b/ffffff.png', 'data-ai-hint': 'golden retriever', votes: 300 },
      { id: 'opt-3b', title: 'Corgi', imageUrl: 'https://placehold.co/600x600/ca8a04/ffffff.png', 'data-ai-hint': 'corgi puppy', votes: 350 },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' },
    status: 'scheduled',
    createdAt: formatISO(now),
    startsAt: formatISO(addDays(now, 1)),
    endsAt: formatISO(addDays(now, 8)),
  },
  {
    id: 'duel-4',
    title: 'Destino de Vacaciones Definitivo',
    description: '¿Relax en la playa o aventura en la montaña?',
    options: [
      { id: 'opt-4a', title: 'Playa Tropical', imageUrl: 'https://placehold.co/600x600/06b6d4/ffffff.png', 'data-ai-hint': 'tropical beach', votes: 190 },
      { id: 'opt-4b', title: 'Montañas Nevadas', imageUrl: 'https://placehold.co/600x600/64748b/ffffff.png', 'data-ai-hint': 'snowy mountains', votes: 210 },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' },
    status: 'closed',
    createdAt: formatISO(subDays(now, 10)),
    startsAt: formatISO(subDays(now, 10)),
    endsAt: formatISO(subDays(now, 3)),
  },
  {
    id: 'duel-5',
    title: 'Gatos vs Perros',
    description: 'La eterna pregunta debe ser resuelta.',
    options: [
      { id: 'opt-5a', title: 'Gatos', imageUrl: 'https://placehold.co/600x600/475569/ffffff.png', 'data-ai-hint': 'cat portrait', votes: 500 },
      { id: 'opt-5b', title: 'Perros', imageUrl: 'https://placehold.co/600x600/94a3b8/ffffff.png', 'data-ai-hint': 'dog portrait', votes: 501 },
    ],
    creator: { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' },
    status: 'closed',
    createdAt: formatISO(subDays(now, 20)),
    startsAt: formatISO(subDays(now, 20)),
    endsAt: formatISO(subDays(now, 15)),
  },
];
