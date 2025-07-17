
import { prisma } from '@/lib/prisma';
import VotingFeed from '@/components/voting-feed';
import type { Duel, User } from '@/lib/types';
import { auth } from '@/app/api/auth/[...nextauth]/route';

async function getInitialData() {
    try {
        const duels = await prisma.duel.findMany({
            where: { status: 'ACTIVE' },
            include: { 
              options: {
                orderBy: {
                  title: 'asc'
                }
              },
              creator: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const users = await prisma.user.findMany();
        
        const transformedDuels = duels.map(d => {
            return {
                ...d,
                options: d.options || [],
                creator: d.creator ? { id: d.creator.id, name: d.creator.name || 'N/A', avatarUrl: d.creator.image || null } : { id: 'unknown', name: 'Usuario Desconocido', avatarUrl: null }
            };
        });

        const transformedUsers: User[] = users.map(u => ({
          id: u.id,
          name: u.name || 'N/A',
          email: u.email || '',
          avatarUrl: u.image || null,
          keys: u.keys,
          duelsCreated: u.duelsCreated ?? 0,
          votesCast: u.votesCast ?? 0,
          role: u.role as 'ADMIN' | 'USER',
          createdAt: u.createdAt?.toISOString()
        }));

        return { duels: transformedDuels as Duel[], users: transformedUsers };
    } catch (error) {
        console.error("Failed to fetch initial data from database:", error);
        // In case of a database error, return empty arrays to prevent a crash
        return { duels: [], users: [] };
    }
}

export default async function Home() {
  const { duels, users } = await getInitialData();
  const session = await auth();

  return (
    <div className="container mx-auto px-4 py-8">
      <VotingFeed initialDuels={duels} initialUsers={users} userId={session?.user?.id}/>
    </div>
  );
}
