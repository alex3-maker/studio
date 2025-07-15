
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { User, Duel, DuelOption, Notification } from '@/lib/types';
import { mockUser, mockDuels } from '@/lib/data';
import { isAfter, isBefore, parseISO, formatISO, addDays } from 'date-fns';

const VOTED_DUELS_STORAGE_KEY = 'dueliax_voted_duels';
const USER_KEYS_STORAGE_KEY = 'dueliax_user_keys';
const DUELS_STORAGE_KEY = 'dueliax_duels';
const NOTIFICATIONS_STORAGE_KEY = 'dueliax_notifications';


interface AppContextType {
  user: User;
  duels: Duel[];
  votedDuelIds: string[];
  notifications: Notification[];
  castVote: (duelId: string, optionId: string) => void;
  addDuel: (newDuel: Duel) => void;
  updateDuel: (updatedDuel: Partial<Duel> & { id: string }) => void;
  toggleDuelStatus: (duelId: string) => void;
  deleteDuel: (duelId: string) => void;
  resetDuelVotes: (duelId: string, isAdminReset?: boolean) => void;
  getDuelStatus: (duel: Duel) => Duel['status'];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getStatus = (duel: Duel): Duel['status'] => {
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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedVotedIds = localStorage.getItem(VOTED_DUELS_STORAGE_KEY);
      if (storedVotedIds) setVotedDuelIds(JSON.parse(storedVotedIds));

      const storedKeys = localStorage.getItem(USER_KEYS_STORAGE_KEY);
      if (storedKeys) setUser(prevUser => ({...prevUser, keys: JSON.parse(storedKeys)}));
      
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

      const storedDuels = localStorage.getItem(DUELS_STORAGE_KEY);
      let duelsToLoad: Duel[] = mockDuels;

      if (storedDuels) {
        const parsedDuels: Duel[] = JSON.parse(storedDuels);
        const repairedDuels = parsedDuels.map(d => {
          if (!d.startsAt || !d.endsAt) {
            console.warn(`Repairing duel ${d.id} with missing dates.`);
            return {
              ...d,
              createdAt: d.createdAt || formatISO(new Date()),
              startsAt: d.startsAt || formatISO(new Date()),
              endsAt: d.endsAt || formatISO(addDays(new Date(), 7)),
              status: 'active',
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
      setDuels(mockDuels);
      localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(mockDuels));
      localStorage.removeItem(USER_KEYS_STORAGE_KEY);
      localStorage.removeItem(VOTED_DUELS_STORAGE_KEY);
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    }
    setIsLoaded(true);
  }, []);

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
      localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(newDuels));
    } catch (error) {
      console.error("Error saving duels to localStorage", error);
    }
  };

  const persistNotifications = (newNotifications: Notification[]) => {
    try {
      setNotifications(newNotifications);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newNotifications));
    } catch (error) {
        console.error("Error saving notifications to localStorage", error);
    }
  }

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
        persistVotedDuels(newIds);
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
        link: null // No link needed, it's just an info
    })
  }, [addNotification]);

  const toggleDuelStatus = useCallback((duelId: string) => {
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(duel => {
        if (duel.id === duelId) {
          const currentStatus = getStatus(duel);
          let newStatus: Duel['status'];
          let newEndsAt = duel.endsAt;

          if (currentStatus === 'active') {
            newEndsAt = new Date().toISOString();
            newStatus = 'closed';
            addNotification({
                type: 'duel-closed',
                message: `El duelo "${duel.title}" ha finalizado. ¡Mira los resultados!`,
                link: `/` // Or a dedicated results page
            });
          } else {
             newEndsAt = addDays(new Date(), 7).toISOString();
             newStatus = 'active';
          }
          return { ...duel, endsAt: newEndsAt, status: newStatus };
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

  const value = { user, duels, castVote, addDuel, updateDuel, toggleDuelStatus, deleteDuel, resetDuelVotes, votedDuelIds, getDuelStatus, notifications, markNotificationAsRead, markAllNotificationsAsRead };

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
