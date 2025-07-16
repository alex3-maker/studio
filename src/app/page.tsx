
import { getDb } from '@/lib/db';
import VotingFeed from '@/components/voting-feed';
import type { Duel, User } from '@/lib/types';
import { users as usersTable, duels as duelsTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function getInitialData() {
    const db = getDb();
    try {
        const usersData = await db.query.users.findMany();
        const duelsData = await db.query.duels.findMany();

        const transformedDuels = duelsData.map(d => {
            const creator = usersData.find(u => u.id === d.creatorId);
            return {
                ...d,
                creator: creator ? { id: creator.id, name: creator.name || 'N/A', avatarUrl: creator.image || null } : { id: 'unknown', name: 'Usuario Desconocido', avatarUrl: null }
            };
        });
        
        const transformedUsers: User[] = usersData.map(u => ({
          id: u.id,
          name: u.name || 'N/A',
          email: u.email,
          avatarUrl: u.image || null,
          keys: u.keys,
          duelsCreated: u.duelsCreated,
          votesCast: u.votesCast,
          role: u.role,
          createdAt: u.createdAt?.toISOString()
        }));

        return { duels: transformedDuels, users: transformedUsers };
    } catch (error) {
        console.error("Failed to fetch initial data from database:", error);
        // Return empty arrays in case of a DB error to prevent a crash
        return { duels: [], users: [] };
    }
}

export default async function Home() {
  const { duels, users } = await getInitialData();

  return (
    <div className="container mx-auto px-4 py-8">
      <VotingFeed initialDuels={duels} initialUsers={users} />
    </div>
  );
}
