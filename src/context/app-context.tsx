
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { User, Duel, DuelOption, Notification, KeyTransaction } from '@/lib/types';
import { mockUser, mockDuels } from '@/lib/data';
import { isAfter, isBefore, parseISO, formatISO, addDays } from 'date-fns';

const VOTED_DUELS_STORAGE_KEY = 'dueliax_voted_duels';
const DUEL_VOTING_HISTORY_STORAGE_KEY = 'dueliax_duel_voting_history';
const USER_STORAGE_KEY = 'dueliax_user';
const DUELS_STORAGE_KEY = 'dueliax_duels';
const NOTIFICATIONS_STORAGE_KEY = 'dueliax_notifications';
const KEY_HISTORY_STORAGE_KEY = 'dueliax_key_history';
const DUEL_CREATION_COST = 5;

interface AppContextType {
  user: User;
  duels: Duel[];
  votedDuelIds: string[];
  notifications: Notification[];
  keyHistory: KeyTransaction[];
  castVote: (duelId: string, optionId: string) => boolean;
  addDuel: (newDuel: Duel, userKeys: number) => void;
  updateDuel: (updatedDuel: Partial<Duel> & { id: string }) => void;
  toggleDuelStatus: (duelId: string) => void;
  deleteDuel: (duelId: string) => void;
  resetDuelVotes: (duelId: string, isAdminReset?: boolean) => void;
  getDuelStatus: (duel: Duel) => Duel['status'];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  activateDraftDuel: (duelId: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getStatus = (duel: Duel): Duel['status'] => {
    if (duel.status === 'draft') {
        return 'draft';
    }
    if (!duel.startsAt || !duel.endsAt) {
      console.warn(`Duel ${duel.id} is missing date information.`);
      return 'closed';
    }
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [keyHistory, setKeyHistory] = useState<KeyTransaction[]>([]);
  const [duelVotingHistory, setDuelVotingHistory] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedVotedIds = localStorage.getItem(VOTED_DUELS_STORAGE_KEY);
      if (storedVotedIds) setVotedDuelIds(JSON.parse(storedVotedIds));

      const storedVotingHistory = localStorage.getItem(DUEL_VOTING_HISTORY_STORAGE_KEY);
      if (storedVotingHistory) setDuelVotingHistory(JSON.parse(storedVotingHistory));
      
      const storedKeyHistory = localStorage.getItem(KEY_HISTORY_STORAGE_KEY);
      if (storedKeyHistory) setKeyHistory(JSON.parse(storedKeyHistory));

      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      }
      
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

      const storedDuels = localStorage.getItem(DUELS_STORAGE_KEY);
      let duelsToLoad: Duel[] = mockDuels;

      if (storedDuels) {
        const parsedDuels: Duel[] = JSON.parse(storedDuels);
        const repairedDuels = parsedDuels.map(d => {
          if (!d.startsAt || !d.endsAt || !d.createdAt) {
            console.warn(`Repairing duel ${d.id} with missing dates.`);
            const now = new Date();
            return {
              ...d,
              createdAt: d.createdAt || formatISO(now),
              startsAt: d.startsAt || formatISO(now),
              endsAt: d.endsAt || formatISO(addDays(now, 7)),
              status: d.status || 'closed', // Ensure status exists
            };
          }
          return d;
        });
        duelsToLoad = repairedDuels;
      }
      
      setDuels(duelsToLoad);
      if (!storedDuels) {
        localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(duelsToLoad));
      }

    } catch (error) {
      console.error("Error reading from localStorage, resetting data.", error);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(DUELS_STORAGE_KEY);
      localStorage.removeItem(VOTED_DUELS_STORAGE_KEY);
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      localStorage.removeItem(DUEL_VOTING_HISTORY_STORAGE_KEY);
      localStorage.removeItem(KEY_HISTORY_STORAGE_KEY);
    }
    setIsLoaded(true);
  }, []);

  const persistUser = (updatedUser: User) => {
    try {
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error saving user to localStorage", error);
    }
  };

  const persistVotedDuels = (newIds: string[]) => {
      try {
        setVotedDuelIds(newIds);
        localStorage.setItem(VOTED_DUELS_STORAGE_KEY, JSON.stringify(newIds));
      } catch (error) {
        console.error("Error saving voted duels to localStorage", error);
      }
  }

  const persistDuels = (newDuels: Duel[]) => {
    try {
      const duelsWithStatus = newDuels.map(d => ({ ...d, status: getStatus(d) }));
      setDuels(duelsWithStatus);
      localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(duelsWithStatus));
    } catch (error) {
      console.error("Error saving duels to localStorage", error);
    }
  };
  
  const persistVotingHistory = (newHistory: string[]) => {
    try {
        setDuelVotingHistory(newHistory);
        localStorage.setItem(DUEL_VOTING_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
        console.error("Error saving voting history to localStorage", error);
    }
  }
  
  const persistKeyHistory = (newHistory: KeyTransaction[]) => {
    try {
        setKeyHistory(newHistory);
        localStorage.setItem(KEY_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
        console.error("Error saving key history to localStorage", error);
    }
  }

  const persistNotifications = (newNotifications: Notification[]) => {
    try {
      setNotifications(newNotifications);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newNotifications));
    } catch (error) {
        console.error("Error saving notifications to localStorage", error);
    }
  }

  const addKeyTransaction = useCallback((type: 'earned' | 'spent', amount: number, description: string) => {
    setKeyHistory(prev => {
        const newTransaction: KeyTransaction = {
            id: `key-${Date.now()}`,
            type,
            amount,
            description,
            timestamp: new Date().toISOString(),
        };
        const updatedHistory = [newTransaction, ...prev].slice(0, 100); // Keep last 100
        persistKeyHistory(updatedHistory);
        return updatedHistory;
    });
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications(prev => {
        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}`,
            timestamp: new Date().toISOString(),
            read: false,
        };
        const updatedNotifications = [newNotification, ...prev].slice(0, 50); // Keep last 50
        persistNotifications(updatedNotifications);
        return updatedNotifications;
    });
  }, []);
  
  const getDuelStatus = useCallback((duel: Duel): Duel['status'] => {
      return getStatus(duel);
  }, []);
  
  const spendKeys = useCallback((amount: number, description: string) => {
    if (user.keys < amount) {
        return false;
    }
    const newUserState = { ...user, keys: user.keys - amount };
    persistUser(newUserState);
    
    addNotification({
      type: 'keys-spent',
      message: `Has gastado ${amount} llaves en: ${description}.`,
      link: null,
    });
    addKeyTransaction('spent', amount, description);
    return true;
  }, [user, addKeyTransaction, addNotification]);

  const castVote = useCallback((duelId: string, optionId: string): boolean => {
    const duel = duels.find(d => d.id === duelId);
    if (!duel) return false;

    setDuels(prevDuels => {
      const newDuels = prevDuels.map(d => {
        if (d.id === duelId) {
          const newOptions = d.options.map(option => {
            if (option.id === optionId) {
              return { ...option, votes: option.votes + 1 };
            }
            return option;
          }) as [DuelOption, DuelOption];
          return { ...d, options: newOptions };
        }
        return d;
      });
      persistDuels(newDuels);
      return newDuels;
    });

    const hasVotedBefore = duelVotingHistory.includes(duelId);
    let awardedKey = false;
    
    if (!hasVotedBefore) {
        awardedKey = true;
        addKeyTransaction('earned', 1, `Voto en "${duel.title}"`);
        
        setDuelVotingHistory(prevHistory => {
            const newHistory = [...prevHistory, duelId];
            persistVotingHistory(newHistory);
            return newHistory;
        });
    }

    const newUserState = {
        ...user,
        votesCast: user.votesCast + 1,
        keys: awardedKey ? user.keys + 1 : user.keys,
    };
    persistUser(newUserState);


    setVotedDuelIds(prevIds => {
        const newIds = [...prevIds, duelId];
        persistVotedDuels(newIds);
        return newIds;
    });

    return awardedKey;

  }, [duels, user, duelVotingHistory, addKeyTransaction]);

  const addDuel = useCallback((newDuel: Duel) => {
    if (newDuel.status !== 'draft') {
        spendKeys(DUEL_CREATION_COST, `Creación de "${newDuel.title}"`);
    }
    
    setDuels(prevDuels => {
      const newDuels = [newDuel, ...prevDuels];
      persistDuels(newDuels);
      return newDuels;
    });
    
    const newUserState = { ...user, duelsCreated: user.duelsCreated + 1 };
    persistUser(newUserState);

  }, [spendKeys, user]);

  const activateDraftDuel = useCallback((duelId: string): boolean => {
    const duel = duels.find(d => d.id === duelId);
    if (!duel || duel.status !== 'draft') {
        return false;
    }

    if (user.keys < DUEL_CREATION_COST) {
        return false;
    }
    
    spendKeys(DUEL_CREATION_COST, `Activación de "${duel.title}"`);

    setDuels(prevDuels => {
        const newDuels = prevDuels.map(d => {
            if (d.id === duelId) {
                // The status will be recalculated to scheduled/active by persistDuels
                return { ...d, status: 'scheduled' }; 
            }
            return d;
        });
        persistDuels(newDuels);
        return newDuels;
    });

    return true;

  }, [duels, user.keys, spendKeys]);

  const updateDuel = useCallback((updatedDuelData: Partial<Duel> & { id: string }) => {
    let duelTitle = '';
    setDuels(prevDuels => {
        const newDuels = prevDuels.map(duel => {
          if (duel.id === updatedDuelData.id) {
            duelTitle = duel.title;
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
    addNotification({
        type: 'duel-edited',
        message: `El duelo "${duelTitle}" ha sido actualizado.`,
        link: null
    })
  }, [addNotification]);

  const toggleDuelStatus = useCallback((duelId: string) => {
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(duel => {
        if (duel.id === duelId) {
          const currentStatus = getStatus(duel);
          let newEndsAt = duel.endsAt;
          let newStartsAt = duel.startsAt;
          let newStatus = duel.status;

          if (currentStatus === 'active') { // Active -> Closed
            newEndsAt = new Date().toISOString();
            newStatus = 'closed';
            addNotification({
                type: 'duel-closed',
                message: `El duelo "${duel.title}" ha finalizado. ¡Mira los resultados!`,
                link: `/`
            });
          } else { // Scheduled/Closed -> Active
             const now = new Date();
             newStartsAt = now.toISOString();
             newEndsAt = addDays(now, 7).toISOString();
             newStatus = 'active';
          }
          return { ...duel, endsAt: newEndsAt, startsAt: newStartsAt, status: newStatus };
        }
        return duel;
      });
      persistDuels(newDuels);
      return newDuels;
    });
  }, [addNotification]);

  const deleteDuel = useCallback((duelId: string) => {
    setDuels(prevDuels => {
        const newDuels = prevDuels.filter(duel => duel.id !== duelId)
        persistDuels(newDuels);
        return newDuels;
    });
  }, []);
  
  const resetDuelVotes = useCallback((duelId: string, isOwnerReset: boolean = false) => {
    let duelTitle = '';
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(duel => {
        if (duel.id === duelId) {
          duelTitle = duel.title;
          const resetOptions = duel.options.map(option => ({ ...option, votes: 0 })) as [DuelOption, DuelOption];
          return { ...duel, options: resetOptions };
        }
        return duel;
      });
      persistDuels(newDuels);
      return newDuels;
    });

    setVotedDuelIds(prevIds => {
      const newIds = prevIds.filter(id => id !== duelId);
      persistVotedDuels(newIds);
      return newIds;
    });

    const message = isOwnerReset 
        ? `Has reiniciado los votos de tu duelo "${duelTitle}".`
        : `Un administrador ha reiniciado los votos del duelo "${duelTitle}".`;

     addNotification({
        type: 'duel-reset',
        message: message,
        link: null
    });

  }, [addNotification]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
        const newNotifications = prev.map(n => n.id === notificationId ? {...n, read: true} : n);
        persistNotifications(newNotifications);
        return newNotifications;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => {
        const readNotifications = prev.map(n => ({...n, read: true}));
        persistNotifications(readNotifications);
        return readNotifications;
    });
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
        const newNotifications = prev.filter(n => n.id !== notificationId);
        persistNotifications(newNotifications);
        return newNotifications;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    persistNotifications([]);
  }, []);

  const value = { 
    user, 
    duels, 
    castVote, 
    addDuel, 
    updateDuel, 
    toggleDuelStatus, 
    deleteDuel, 
    resetDuelVotes, 
    votedDuelIds, 
    getDuelStatus, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    keyHistory,
    activateDraftDuel
  };

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
