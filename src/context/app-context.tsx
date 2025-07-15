
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { User, Duel, DuelOption } from '@/lib/types';
import { mockUser, mockDuels } from '@/lib/data';
import { isAfter, isBefore, parseISO } from 'date-fns';

const VOTED_DUELS_STORAGE_KEY = 'dueliax_voted_duels';
const USER_KEYS_STORAGE_KEY = 'dueliax_user_keys';
const DUELS_STORAGE_KEY = 'dueliax_duels';

interface AppContextType {
  user: User;
  duels: Duel[];
  votedDuelIds: string[];
  castVote: (duelId: string, optionId: string) => void;
  addDuel: (newDuel: Duel) => void;
  updateDuel: (updatedDuel: Partial<Duel> & { id: string }) => void;
  toggleDuelStatus: (duelId: string) => void;
  deleteDuel: (duelId: string) => void;
  resetDuelVotes: (duelId: string) => void;
  getDuelStatus: (duel: Duel) => Duel['status'];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getStatus = (duel: Duel): Duel['status'] => {
    const now = new Date();
    const startsAt = parseISO(duel.startsAt);
    const endsAt = parseISO(duel.endsAt);

    if (isBefore(now, startsAt)) {
        return 'scheduled';
    }
    if (isAfter(now, endsAt)) {
        return 'closed';
    }
    return 'active';
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [votedDuelIds, setVotedDuelIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedVotedIds = localStorage.getItem(VOTED_DUELS_STORAGE_KEY);
      if (storedVotedIds) {
        setVotedDuelIds(JSON.parse(storedVotedIds));
      }

      const storedKeys = localStorage.getItem(USER_KEYS_STORAGE_KEY);
      if (storedKeys) {
        setUser(prevUser => ({...prevUser, keys: JSON.parse(storedKeys)}));
      }

      const storedDuels = localStorage.getItem(DUELS_STORAGE_KEY);
      if (storedDuels) {
        setDuels(JSON.parse(storedDuels));
      } else {
        setDuels(mockDuels);
        localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(mockDuels));
      }

    } catch (error) {
      console.error("Error reading from localStorage", error);
      if(duels.length === 0) setDuels(mockDuels);
    }
    setIsLoaded(true);
  }, []);

  const persistDuels = (newDuels: Duel[]) => {
    try {
      localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(newDuels));
    } catch (error) {
      console.error("Error saving duels to localStorage", error);
    }
  };
  
  const getDuelStatus = useCallback((duel: Duel): Duel['status'] => {
      return getStatus(duel);
  }, []);

  const castVote = useCallback((duelId: string, optionId: string) => {
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(duel => {
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
      });
      persistDuels(newDuels);
      return newDuels;
    });

    setUser(prevUser => {
        const newKeys = prevUser.keys + 1;
        try {
            localStorage.setItem(USER_KEYS_STORAGE_KEY, JSON.stringify(newKeys));
        } catch (error) {
            console.error("Error saving keys to localStorage", error);
        }
        return {
            ...prevUser,
            keys: newKeys,
            votesCast: prevUser.votesCast + 1,
        }
    });

    setVotedDuelIds(prevIds => {
        const newIds = [...prevIds, duelId];
        try {
            localStorage.setItem(VOTED_DUELS_STORAGE_KEY, JSON.stringify(newIds));
        } catch (error) {
            console.error("Error saving voted duels to localStorage", error);
        }
        return newIds;
    });

  }, []);

  const addDuel = useCallback((newDuel: Duel) => {
    setDuels(prevDuels => {
      const newDuels = [newDuel, ...prevDuels];
      persistDuels(newDuels);
      return newDuels;
    });
    setUser(prevUser => ({
      ...prevUser,
      duelsCreated: prevUser.duelsCreated + 1,
    }));
  }, []);

  const updateDuel = useCallback((updatedDuelData: Partial<Duel> & { id: string }) => {
    setDuels(prevDuels => {
        const newDuels = prevDuels.map(duel => {
          if (duel.id === updatedDuelData.id) {
            const originalOptions = duel.options;
            const updatedOptions = updatedDuelData.options?.map((opt, index) => {
                const originalOption = originalOptions.find(o => o.id === opt.id) || originalOptions[index];
                return { ...originalOption, ...opt };
            }) as [DuelOption, DuelOption] | undefined;

            return {
              ...duel,
              ...updatedDuelData,
              options: updatedOptions || duel.options,
            };
          }
          return duel;
        });

        persistDuels(newDuels);
        return newDuels;
      }
    );
  }, []);

  const toggleDuelStatus = useCallback((duelId: string) => {
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(duel => {
        if (duel.id === duelId) {
          const currentStatus = getStatus(duel);
          if (currentStatus === 'active') {
            // If active, close it now.
            return { ...duel, endsAt: new Date().toISOString() };
          } else {
            // If closed or scheduled, make it active indefinitely.
            return { 
                ...duel, 
                startsAt: new Date().toISOString(),
                endsAt: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString() // active for 10 years
            };
          }
        }
        return duel;
      });
      persistDuels(newDuels);
      return newDuels;
    });
  }, []);

  const deleteDuel = useCallback((duelId: string) => {
    setDuels(prevDuels => {
        const newDuels = prevDuels.filter(duel => duel.id !== duelId)
        persistDuels(newDuels);
        return newDuels;
    });
  }, []);
  
  const resetDuelVotes = useCallback((duelId: string) => {
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(duel => {
        if (duel.id === duelId) {
          const resetOptions = duel.options.map(option => ({ ...option, votes: 0 })) as [DuelOption, DuelOption];
          return { ...duel, options: resetOptions };
        }
        return duel;
      });
      persistDuels(newDuels);
      return newDuels;
    });
  }, []);

  const value = { user, duels, castVote, addDuel, updateDuel, toggleDuelStatus, deleteDuel, resetDuelVotes, votedDuelIds, getDuelStatus };

  if (!isLoaded) {
    return null; 
  }

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
