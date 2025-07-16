
import type { User, Duel } from './types';
import { subDays, addDays, formatISO } from 'date-fns';

const now = new Date();

// This file is now deprecated and will be removed.
// The data is now sourced from the database.
// We keep it for now to avoid breaking imports, but it should not be used.

export const mockUsers: (User & { password?: string })[] = [];
export const mockDuels: Duel[] = [];
