
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
    // Ensure duel and its properties exist before trying to access them
    if (!duel || duel.status === 'draft') {
        return 'draft';
    }
    if (!duel.startsAt || !duel.endsAt) {
      return 'closed';
    }
    try {
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
    } catch (error) {
        console.error("Error parsing duel dates, defaulting to closed:", duel, error);
        return 'closed';
    }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [votedDuelIds, setVotedDuelIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [keyHistory, setKeyHistory] = useState<KeyTransaction[]>([]);
  const [duelVotingHistory, setDuelVotingHistory] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) setUser(JSON.parse(storedUser));
      else localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      
      const storedDuels = localStorage.getItem(DUELS_STORAGE_KEY);
      if (storedDuels) {
        const parsedDuels: Duel[] = JSON.parse(storedDuels);
        const repairedDuels = parsedDuels.map(d => {
            if (!d.startsAt || !d.endsAt || !d.createdAt) {
                const now = new Date();
                return {
                    ...d,
                    createdAt: d.createdAt || formatISO(now),
                    startsAt: d.startsAt || formatISO(now),
                    endsAt: d.endsAt || formatISO(addDays(now, 7)),
                    status: d.status || 'closed',
                };
            }
            return d;
        });
        setDuels(repairedDuels);
      } else {
        setDuels(mockDuels);
      }
      
      const storedVotedIds = localStorage.getItem(VOTED_DUELS_STORAGE_KEY);
      if (storedVotedIds) setVotedDuelIds(JSON.parse(storedVotedIds));

      const storedVotingHistory = localStorage.getItem(DUEL_VOTING_HISTORY_STORAGE_KEY);
      if (storedVotingHistory) setDuelVotingHistory(JSON.parse(storedVotingHistory));
      
      const storedKeyHistory = localStorage.getItem(KEY_HISTORY_STORAGE_KEY);
      if (storedKeyHistory) setKeyHistory(JSON.parse(storedKeyHistory));
      
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

    } catch (error) {
      console.error("Error reading from localStorage, resetting data.", error);
      localStorage.clear(); // Clear all if there's a parsing error.
      setUser(mockUser);
      setDuels(mockDuels);
    }
    setIsLoaded(true);
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, [user, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(duels));
  }, [duels, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(VOTED_DUELS_STORAGE_KEY, JSON.stringify(votedDuelIds));
  }, [votedDuelIds, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(KEY_HISTORY_STORAGE_KEY, JSON.stringify(keyHistory));
  }, [keyHistory, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(DUEL_VOTING_HISTORY_STORAGE_KEY, JSON.stringify(duelVotingHistory));
  }, [duelVotingHistory, isLoaded]);


  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications(prev => [
        {
            ...notification,
            id: `notif-${Date.now()}`,
            timestamp: new Date().toISOString(),
            read: false,
        },
        ...prev
    ].slice(0, 50));
  }, []);
  
  const addKeyTransaction = useCallback((type: 'earned' | 'spent', amount: number, description: string) => {
    setKeyHistory(prev => [
        {
            id: `key-${Date.now()}`,
            type,
            amount,
            description,
            timestamp: new Date().toISOString(),
        },
        ...prev
    ].slice(0, 100));
  }, []);
  
  const getDuelStatus = useCallback((duel: Duel): Duel['status'] => {
      return getStatus(duel);
  }, []);
  
  const spendKeys = useCallback((amount: number, description: string) => {
    let success = false;
    setUser(prevUser => {
        if (prevUser.keys < amount) {
            success = false;
            return prevUser;
        }
        addNotification({
          type: 'keys-spent',
          message: `Has gastado ${amount} llaves en: ${description}.`,
          link: null,
        });
        addKeyTransaction('spent', amount, description);
        success = true;
        return { ...prevUser, keys: prevUser.keys - amount };
    });
    return success;
  }, [addKeyTransaction, addNotification]);

  const castVote = useCallback((duelId: string, optionId: string): boolean => {
    const duel = duels.find(d => d.id === duelId);
    if (!duel) return false;

    setDuels(prevDuels => prevDuels.map(d => {
        if (d.id === duelId) {
          const newOptions = d.options.map(option => 
            option.id === optionId ? { ...option, votes: option.votes + 1 } : option
          ) as [DuelOption, DuelOption];
          return { ...d, options: newOptions };
        }
        return d;
    }));

    const hasVotedBefore = duelVotingHistory.includes(duelId);
    let awardedKey = false;
    
    if (!hasVotedBefore) {
        awardedKey = true;
        addKeyTransaction('earned', 1, `Voto en "${duel.title}"`);
        setDuelVotingHistory(prevHistory => [...prevHistory, duelId]);
    }
    
    setUser(prevUser => ({
        ...prevUser,
        votesCast: prevUser.votesCast + 1,
        keys: awardedKey ? prevUser.keys + 1 : prevUser.keys,
    }));

    setVotedDuelIds(prevIds => [...prevIds, duelId]);

    return awardedKey;

  }, [duels, duelVotingHistory, addKeyTransaction]);

  const addDuel = useCallback((newDuel: Duel) => {
    if (newDuel.status !== 'draft') {
        spendKeys(DUEL_CREATION_COST, `Creación de "${newDuel.title}"`);
    }
    
    setDuels(prevDuels => [newDuel, ...prevDuels]);
    setUser(prevUser => ({ ...prevUser, duelsCreated: prevUser.duelsCreated + 1 }));

  }, [spendKeys]);

  const activateDraftDuel = useCallback((duelId: string): boolean => {
    const duel = duels.find(d => d.id === duelId);
    if (!duel || duel.status !== 'draft') {
        return false;
    }

    if (!spendKeys(DUEL_CREATION_COST, `Activación de "${duel.title}"`)) {
      return false; 
    }

    setDuels(prevDuels => prevDuels.map(d => 
        d.id === duelId ? { ...d, status: 'scheduled' } : d
    ));

    return true;

  }, [duels, spendKeys]);

  const updateDuel = useCallback((updatedDuelData: Partial<Duel> & { id: string }) => {
    let duelTitle = '';
    setDuels(prevDuels => prevDuels.map(duel => {
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
        })
    );
    addNotification({
        type: 'duel-edited',
        message: `El duelo "${duelTitle}" ha sido actualizado.`,
        link: null
    })
  }, [addNotification]);

  const toggleDuelStatus = useCallback((duelId: string) => {
    setDuels(prevDuels => prevDuels.map(duel => {
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
      })
    );
  }, [addNotification]);

  const deleteDuel = useCallback((duelId: string) => {
    const duelToDelete = duels.find(d => d.id === duelId);
    if (!duelToDelete) return;
    
    setDuels(prevDuels => prevDuels.filter(duel => duel.id !== duelId));
    
    if (duelToDelete.creator.id === user.id) {
        setUser(prevUser => ({ ...prevUser, duelsCreated: Math.max(0, prevUser.duelsCreated - 1) }));
    }
  }, [duels, user.id]);
  
  const resetDuelVotes = useCallback((duelId: string, isOwnerReset: boolean = false) => {
    let duelTitle = '';
    setDuels(prevDuels => prevDuels.map(duel => {
        if (duel.id === duelId) {
          duelTitle = duel.title;
          const resetOptions = duel.options.map(option => ({ ...option, votes: 0 })) as [DuelOption, DuelOption];
          return { ...duel, options: resetOptions };
        }
        return duel;
    }));

    setVotedDuelIds(prevIds => prevIds.filter(id => id !== duelId));

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
    setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, read: true} : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
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
