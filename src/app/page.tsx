
import { prisma } from '@/lib/prisma';
import VotingFeed from '@/components/voting-feed';
import type { Duel, User } from '@/lib/types';
import { eq } from 'drizzle-orm';
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
              }
            },
            orderBy: { createdAt: 'desc' },
        });

        const users = await prisma.user.findMany();
        
        // This transformation is to ensure the shape matches your front-end type `Duel`
        // if Prisma's returned shape is different (e.g., creator relation).
        // Let's assume Prisma returns a `creatorId`, and we need to embed creator info.
        const transformedDuels = duels.map(d => {
            const creator = users.find(u => u.id === d.creatorId);
            return {
                ...d,
                // Ensure `options` is an array even if Prisma returns null/undefined
                options: d.options || [],
                // This is a stand-in until you define the relation in Prisma schema
                creator: creator ? { id: creator.id, name: creator.name || 'N/A', avatarUrl: creator.image || null } : { id: 'unknown', name: 'Usuario Desconocido', avatarUrl: null }
            };
        });

        const transformedUsers: User[] = users.map(u => ({
          id: u.id,
          name: u.name || 'N/A',
          email: u.email,
          avatarUrl: u.image || null,
          keys: u.keys,
          duelsCreated: u.duelsCreated,
          votesCast: u.votesCast,
          role: u.role as 'ADMIN' | 'USER',
          createdAt: u.createdAt?.toISOString()
        }));

        return { duels: transformedDuels as Duel[], users: transformedUsers };
    } catch (error) {
        console.error("Failed to fetch initial data from database:", error);
        // Return empty arrays in case of a DB error to prevent a crash
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
