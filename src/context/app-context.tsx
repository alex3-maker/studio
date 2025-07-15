'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Duel, DuelOption } from '@/lib/types';
import { mockUser, mockDuels } from '@/lib/data';
import { createDuelAction, FormState } from '@/lib/actions';
import { useActionState } from 'react';
import { CreateDuelFormValues } from '@/lib/schemas';

interface AppContextType {
  user: User;
  duels: Duel[];
  castVote: (duelId: string, optionId: string) => void;
  createDuel: (duelData: CreateDuelFormValues) => Promise<FormState>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [duels, setDuels] = useState<Duel[]>(mockDuels);

  const castVote = (duelId: string, optionId: string) => {
    // Update duel votes
    setDuels(prevDuels =>
      prevDuels.map(duel => {
        if (duel.id === duelId) {
          const newOptions = duel.options.map(option => {
            if (option.id === optionId) {
              return { ...option, votes: option.votes + 1 };
            }
            return option;
          }) as [DuelOption, DuelOption];
          return { ...duel, options: newOptions };
        }
        return duel;
      })
    );

    // Update user stats
    setUser(prevUser => ({
      ...prevUser,
      keys: prevUser.keys + 1,
      votesCast: prevUser.votesCast + 1,
    }));
  };

  const createDuel = async (duelData: CreateDuelFormValues): Promise<FormState> => {
    // This function is a placeholder for where the form action would be called
    // In this setup, we simulate the duel creation and update the state directly
    // The actual form uses a server action, which updates the "database" (our mock data)
    
    // Simulate what the server action does for state update
    const newDuel: Duel = {
      id: `duel-${Date.now()}`,
      title: duelData.title,
      description: duelData.description || '',
      type: duelData.type,
      status: 'active',
      creator: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      options: [
        { id: `opt-${Date.now()}-a`, title: duelData.options[0].title, imageUrl: duelData.options[0].imageUrl, votes: 0 },
        { id: `opt-${Date.now()}-b`, title: duelData.options[1].title, imageUrl: duelData.options[1].imageUrl, votes: 0 },
      ],
    };

    setDuels(prevDuels => [newDuel, ...prevDuels]);
    setUser(prevUser => ({
      ...prevUser,
      duelsCreated: prevUser.duelsCreated + 1,
    }));
    
    // This return is for satisfying the type, but the real logic is above
    return { success: true, message: "Duel created successfully!" };
  };


  const [formState, formAction, isPending] = useActionState(createDuelAction, { success: false, message: ""});

  useEffect(() => {
    if (formState.success && formState.newDuel) {
       const newDuel: Duel = {
        id: `duel-${Date.now()}`,
        title: formState.newDuel.title,
        description: formState.newDuel.description || '',
        type: formState.newDuel.type,
        status: 'active',
        creator: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        options: [
          { id: `opt-${Date.now()}-a`, title: formState.newDuel.options[0].title, imageUrl: formState.newDuel.options[0].imageUrl, votes: 0 },
          { id: `opt-${Date.now()}-b`, title: formState.newDuel.options[1].title, imageUrl: formState.newDuel.options[1].imageUrl, votes: 0 },
        ],
      };

      setDuels(prevDuels => [newDuel, ...prevDuels]);
      setUser(prevUser => ({
        ...prevUser,
        duelsCreated: prevUser.duelsCreated + 1,
      }));
    }
  }, [formState, user.id, user.name, user.avatarUrl]);


  return (
    <AppContext.Provider value={{ user, duels, castVote, createDuel }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
