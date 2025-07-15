
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { User, Duel, DuelOption } from '@/lib/types';
import { mockUser, mockDuels } from '@/lib/data';

interface AppContextType {
  user: User;
  duels: Duel[];
  castVote: (duelId: string, optionId: string) => void;
  addDuel: (newDuel: Duel) => void;
  updateDuel: (updatedDuel: Partial<Duel> & { id: string }) => void;
  toggleDuelStatus: (duelId: string) => void;
  deleteDuel: (duelId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [duels, setDuels] = useState<Duel[]>(mockDuels);

  const castVote = useCallback((duelId: string, optionId: string) => {
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

    setUser(prevUser => ({
      ...prevUser,
      keys: prevUser.keys + 1,
      votesCast: prevUser.votesCast + 1,
    }));
  }, []);

  const addDuel = useCallback((newDuel: Duel) => {
    setDuels(prevDuels => [newDuel, ...prevDuels]);
    setUser(prevUser => ({
      ...prevUser,
      duelsCreated: prevUser.duelsCreated + 1,
    }));
  }, []);

  const updateDuel = useCallback((updatedDuelData: Partial<Duel> & { id: string }) => {
    setDuels(prevDuels =>
      prevDuels.map(duel => {
        if (duel.id === updatedDuelData.id) {
          // Merge new data with existing data, preserving votes
          const updatedOptions = updatedDuelData.options?.map((opt, index) => ({
            ...duel.options[index], // Preserve original id and votes
            ...opt, // Apply new title and imageUrl
          })) as [DuelOption, DuelOption] | undefined;

          return {
            ...duel,
            ...updatedDuelData,
            options: updatedOptions || duel.options,
          };
        }
        return duel;
      })
    );
  }, []);


  const toggleDuelStatus = useCallback((duelId: string) => {
    setDuels(prevDuels => prevDuels.map(duel => 
      duel.id === duelId ? { ...duel, status: duel.status === 'active' ? 'closed' : 'active' } : duel
    ));
  }, []);

  const deleteDuel = useCallback((duelId: string) => {
    setDuels(prevDuels => prevDuels.filter(duel => duel.id !== duelId));
  }, []);
  
  const value = { user, duels, castVote, addDuel, updateDuel, toggleDuelStatus, deleteDuel };

  return (
    <AppContext.Provider value={value}>
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
