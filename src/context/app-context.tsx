
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { User, Duel, DuelOption } from '@/lib/types';
import { mockUser, mockDuels } from '@/lib/data';

interface AppContextType {
  user: User;
  duels: Duel[];
  castVote: (duelId: string, optionId: string) => void;
  addDuel: (newDuel: Duel) => void;
  updateDuel: (updatedDuel: Duel) => void;
  toggleDuelStatus: (duelId: string) => void;
  deleteDuel: (duelId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [duels, setDuels] = useState<Duel[]>(mockDuels);

  const castVote = (duelId: string, optionId: string) => {
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
  };

  const addDuel = (newDuel: Duel) => {
    setDuels(prevDuels => [newDuel, ...prevDuels]);
    setUser(prevUser => ({
      ...prevUser,
      duelsCreated: prevUser.duelsCreated + 1,
    }));
  };

  const updateDuel = (updatedDuel: Duel) => {
    setDuels(prevDuels => prevDuels.map(d => (d.id === updatedDuel.id ? updatedDuel : d)));
  };

  const toggleDuelStatus = (duelId: string) => {
    setDuels(prevDuels => prevDuels.map(duel => 
      duel.id === duelId ? { ...duel, status: duel.status === 'active' ? 'closed' : 'active' } : duel
    ));
  };

  const deleteDuel = (duelId: string) => {
    setDuels(prevDuels => prevDuels.filter(duel => duel.id !== duelId));
  };
  
  return (
    <AppContext.Provider value={{ user, duels, castVote, addDuel, updateDuel, toggleDuelStatus, deleteDuel }}>
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
