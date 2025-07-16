
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { User, Duel, DuelOption, Notification, KeyTransaction, UserVote } from '@/lib/types';
import { mockDuels, mockUsers } from '@/lib/data';
import { isAfter, isBefore, parseISO, formatISO } from 'date-fns';

const VOTED_DUELS_STORAGE_KEY = 'dueliax_voted_duels';
const USER_VOTES_STORAGE_KEY = 'dueliax_user_votes';
const DUEL_VOTING_HISTORY_STORAGE_KEY = 'dueliax_duel_voting_history';
const USERS_STORAGE_KEY = 'dueliax_users';
const CURRENT_USER_ID_KEY = 'dueliax_current_user_id';
const DUELS_STORAGE_KEY = 'dueliax_duels';
const NOTIFICATIONS_STORAGE_KEY = 'dueliax_notifications';
const KEY_HISTORY_STORAGE_KEY = 'dueliax_key_history';
const API_KEY_STORAGE_KEY = 'dueliax_api_key';
const AI_ENABLED_STORAGE_KEY = 'dueliax_ai_enabled';
const DUEL_CREATION_COST = 5;

interface AppContextType {
  // NOTE: User object is now managed by next-auth SessionProvider
  // user: User; 
  duels: Duel[];
  votedDuelIds: string[];
  userVotedOptions: Record<string, UserVote>;
  notifications: Notification[];
  keyHistory: KeyTransaction[];
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
  castVote: (duelId: string, optionId: string, userId: string) => { awardedKey: boolean; updatedDuel: Duel | null };
  addDuel: (newDuel: Omit<Duel, 'id' | 'creator' | 'createdAt'>, creator: Pick<User, 'id' | 'name' | 'avatarUrl'>) => void;
  updateDuel: (updatedDuel: Partial<Duel> & { id: string }) => void;
  toggleDuelStatus: (duelId: string) => void;
  deleteDuel: (duelId: string) => void;
  deleteMultipleDuels: (duelIds: string[]) => void;
  activateMultipleDuels: (duelIds: string[], userKeys: number, userId: string) => void;
  deactivateMultipleDuels: (duelIds: string[]) => void;
  resetDuelVotes: (duelId: string, isAdminReset?: boolean) => void;
  getDuelStatus: (duel: Duel) => Duel['status'];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  activateDraftDuel: (duelId: string, userKeys: number, userId: string) => boolean;
  getAllUsers: () => User[];
  updateUserRole: (userId: string, newRole: 'ADMIN' | 'USER') => void;
  deleteUser: (userId: string) => void;
  adjustUserKeys: (userId: string, amount: number, reason: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getStatus = (duel: Duel): Duel['status'] => {
    if (!duel) return 'CLOSED';
    if (duel.status === 'INACTIVE') return 'INACTIVE'; // Respect manual override
    if (duel.status === 'DRAFT') return 'DRAFT';
    
    try {
        const now = new Date();
        const startsAt = parseISO(duel.startsAt);
        const endsAt = parseISO(duel.endsAt);

        if (isBefore(now, startsAt)) return 'SCHEDULED';
        if (isAfter(now, endsAt)) return 'CLOSED';
        return 'ACTIVE';
    } catch (error) {
        console.error("Error parsing duel dates, defaulting to closed:", duel, error);
        return 'CLOSED';
    }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // User state is no longer managed here. It will come from useSession().
  const [users, setUsers] = useState<User[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [votedDuelIds, setVotedDuelIds] = useState<string[]>([]);
  const [userVotedOptions, setUserVotedOptions] = useState<Record<string, UserVote>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [keyHistory, setKeyHistory] = useState<KeyTransaction[]>([]);
  const [duelVotingHistory, setDuelVotingHistory] = useState<string[]>([]);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isAiEnabled, setAiEnabledState] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);
  
  
  // Load from localStorage on initial render
  useEffect(() => {
    try {
      const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedApiKey) setApiKeyState(storedApiKey);
      
      const storedAiEnabled = localStorage.getItem(AI_ENABLED_STORAGE_KEY);
      setAiEnabledState(storedAiEnabled ? JSON.parse(storedAiEnabled) : true);

      const storedDuels = localStorage.getItem(DUELS_STORAGE_KEY);
      if (storedDuels) {
        setDuels(JSON.parse(storedDuels));
      } else {
        localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(mockDuels));
        setDuels(mockDuels);
      }
      
      // Users are now managed server-side, but we might keep mock for dev
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
       if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
        setUsers(mockUsers);
      }
      
      // The concept of a single "current user" is replaced by the session.
      // We no longer need to manage this here.

      const storedVotedIds = localStorage.getItem(VOTED_DUELS_STORAGE_KEY);
      if (storedVotedIds) setVotedDuelIds(JSON.parse(storedVotedIds));

      const storedUserVotes = localStorage.getItem(USER_VOTES_STORAGE_KEY);
      if (storedUserVotes) setUserVotedOptions(JSON.parse(storedUserVotes));

      const storedVotingHistory = localStorage.getItem(DUEL_VOTING_HISTORY_STORAGE_KEY);
      if (storedVotingHistory) setDuelVotingHistory(JSON.parse(storedVotingHistory));
      
      const storedKeyHistory = localStorage.getItem(KEY_HISTORY_STORAGE_KEY);
      if (storedKeyHistory) setKeyHistory(JSON.parse(storedKeyHistory));
      
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

    } catch (error) {
      console.error("Error reading from localStorage, using defaults.", error);
      setUsers(mockUsers);
      setDuels(mockDuels);
    }
    setIsLoaded(true);
  }, []);
  
  // Persist state changes to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(DUELS_STORAGE_KEY, JSON.stringify(duels));
  }, [duels, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(VOTED_DUELS_STORAGE_KEY, JSON.stringify(votedDuelIds));
  }, [votedDuelIds, isLoaded]);
  
  useEffect(() => {
    if (isLoaded) localStorage.setItem(USER_VOTES_STORAGE_KEY, JSON.stringify(userVotedOptions));
  }, [userVotedOptions, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(KEY_HISTORY_STORAGE_KEY, JSON.stringify(keyHistory));
  }, [keyHistory, isLoaded]);
  
  useEffect(() => {
    if (isLoaded) localStorage.setItem(DUEL_VOTING_HISTORY_STORAGE_KEY, JSON.stringify(duelVotingHistory));
  }, [duelVotingHistory, isLoaded]);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  }, []);

  const setIsAiEnabled = useCallback((enabled: boolean) => {
    setAiEnabledState(enabled);
    localStorage.setItem(AI_ENABLED_STORAGE_KEY, JSON.stringify(enabled));
  }, []);


  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'userId'>) => {
    const newNotif: Omit<Notification, 'userId'> = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        read: false,
    };
    setNotifications(prev => {
        const now = Date.now();
        const isDuplicate = prev.some(n => 
            n.message === newNotif.message && (now - parseISO(n.timestamp).getTime()) < 2000
        );
        if (isDuplicate) return prev;
        return [newNotif as Notification, ...prev].slice(0, 50);
    });
  }, []);

  const addKeyTransaction = useCallback((type: 'EARNED' | 'SPENT', amount: number, description: string) => {
    setKeyHistory(prev => [
        {
            id: `key-${Date.now()}`,
            type,
            amount,
            description,
            timestamp: new Date().toISOString(),
            userId: 'temp-user' // This will be replaced by actual userId
        },
        ...prev
    ].slice(0, 100));
  }, []);
  
  const getDuelStatus = useCallback((duel: Duel): Duel['status'] => {
      return getStatus(duel);
  }, []);
  
  const spendKeys = useCallback((amount: number, description: string, userId: string) => {
    let success = false;
    setUsers(prevUsers => {
        return prevUsers.map(u => {
            if (u.id === userId && u.keys >= amount) {
                success = true;
                addKeyTransaction('SPENT', amount, description);
                addNotification({
                  type: 'KEYS_SPENT',
                  message: `Has gastado ${amount} llaves en: ${description}.`,
                  link: null,
                });
                return {...u, keys: u.keys - amount};
            }
            return u;
        })
    });
    return success;
  }, [addKeyTransaction, addNotification]);

  const castVote = useCallback((duelId: string, optionId: string, userId: string): { awardedKey: boolean; updatedDuel: Duel | null } => {
    let awardedKey = false;
    let finalUpdatedDuel: Duel | null = null;
    
    setDuels(prevDuels => {
        const newDuels = prevDuels.map(d => {
            if (d.id === duelId) {
                const newOptions = d.options.map(option => 
                    option.id === optionId ? { ...option, votes: (option.votes || 0) + 1 } : option
                );
                finalUpdatedDuel = { ...d, options: newOptions };
                return finalUpdatedDuel;
            }
            return d;
        });
        return newDuels;
    });

    if (finalUpdatedDuel) {
        const hasVotedBefore = duelVotingHistory.includes(duelId);
        
        if (!hasVotedBefore) {
            awardedKey = true;
            addKeyTransaction('EARNED', 1, `Voto en "${finalUpdatedDuel.title}"`);
            setDuelVotingHistory(prevHistory => [...prevHistory, duelId]);
        }
        
        setUsers(prevUsers => prevUsers.map(u => {
            if (u.id === userId) {
                return {
                    ...u,
                    votesCast: u.votesCast + 1,
                    keys: awardedKey ? u.keys + 1 : u.keys,
                };
            }
            return u;
        }));
    }

    setVotedDuelIds(prevIds => [...prevIds, duelId]);
    setUserVotedOptions(prevVotes => ({
        ...prevVotes,
        [duelId]: { optionId, timestamp: new Date().toISOString() },
    }));

    return { awardedKey, updatedDuel: finalUpdatedDuel };
  }, [duelVotingHistory, addKeyTransaction]);

  const addDuel = useCallback((newDuelData: Omit<Duel, 'id' | 'creator' | 'createdAt'>, creator: Pick<User, 'id' | 'name' | 'avatarUrl'>) => {
    const creatorUser = users.find(u => u.id === creator.id);
    if (!creatorUser) return;
    
    const hasEnoughKeys = creatorUser.keys >= DUEL_CREATION_COST;
    const status = getStatus({ ...newDuelData, status: hasEnoughKeys ? 'SCHEDULED' : 'DRAFT' } as Duel);
    
    const newDuelWithStatus: Duel = { 
      ...newDuelData, 
      id: `duel-${Date.now()}-${Math.random()}`,
      creator: creator,
      createdAt: formatISO(new Date()),
      status 
    };

    setDuels(prevDuels => [newDuelWithStatus, ...prevDuels]);
    
    if (status !== 'DRAFT') {
        spendKeys(DUEL_CREATION_COST, `Creación de "${newDuelData.title}"`, creator.id);
    }
    
    setUsers(prevUsers => prevUsers.map(u => 
      u.id === creator.id ? {...u, duelsCreated: u.duelsCreated + 1 } : u
    ));
  }, [users, spendKeys]);

  const activateDraftDuel = useCallback((duelId: string, userKeys: number, userId: string): boolean => {
    const duel = duels.find(d => d.id === duelId);
    if (!duel || duel.status !== 'DRAFT' || userKeys < DUEL_CREATION_COST) return false;
    
    const success = spendKeys(DUEL_CREATION_COST, `Activación de "${duel.title}"`, userId);
    if (success) {
      setDuels(prevDuels => prevDuels.map(d => 
          d.id === duelId ? { ...d, status: getStatus({ ...d, status: 'ACTIVE' } as Duel) } : d
      ));
    }
    return success;
  }, [duels, spendKeys]);

  const updateDuel = useCallback((updatedDuelData: Partial<Duel> & { id: string }) => {
    setDuels(prevDuels => prevDuels.map(duel => {
      if (duel.id === updatedDuelData.id) {
        const originalDuel = prevDuels.find(d => d.id === updatedDuelData.id);
        if (!originalDuel) return duel;

        const updatedOptions = updatedDuelData.options?.map(updatedOpt => {
          const originalOpt = originalDuel.options.find(o => o.id === updatedOpt.id);
          return {
            ...updatedOpt,
            votes: originalOpt ? (originalOpt.votes || 0) : 0,
          };
        });

        return { ...duel, ...updatedDuelData, options: updatedOptions || duel.options };
      }
      return duel;
    }));
  }, []);

  const toggleDuelStatus = useCallback((duelId: string) => {
    let notificationMessage = '';
    setDuels(prevDuels => prevDuels.map(duel => {
      if (duel.id === duelId) {
        const currentStatus = getStatus(duel);
        let newStatus: Duel['status'];
        if (currentStatus === 'ACTIVE') {
          newStatus = 'INACTIVE';
          notificationMessage = `El duelo "${duel.title}" ha sido desactivado.`;
        } else {
          newStatus = 'ACTIVE';
          notificationMessage = `El duelo "${duel.title}" ha sido activado de nuevo.`;
        }
        const tempDuel = { ...duel, status: newStatus };
        return { ...tempDuel, status: getStatus(tempDuel) };
      }
      return duel;
    }));
     if (notificationMessage) {
        addNotification({
            type: 'DUEL_EDITED',
            message: notificationMessage,
            link: `/`
        });
    }
  }, [addNotification]);


  const deleteDuel = useCallback((duelId: string) => {
    const duelToDelete = duels.find(d => d.id === duelId);
    if (!duelToDelete) return;
    
    setDuels(prevDuels => prevDuels.filter(duel => duel.id !== duelId));
    
    setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === duelToDelete.creator.id) {
            return { ...u, duelsCreated: Math.max(0, u.duelsCreated - 1) };
        }
        return u;
    }));
  }, [duels]);
  
  const deleteMultipleDuels = useCallback((duelIds: string[]) => {
    const duelsToDelete = duels.filter(d => duelIds.includes(d.id));
    if (duelsToDelete.length === 0) return;

    setDuels(prevDuels => prevDuels.filter(duel => !duelIds.includes(duel.id)));

    const duelsByCreator = duelsToDelete.reduce((acc, duel) => {
        acc[duel.creator.id] = (acc[duel.creator.id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    setUsers(prevUsers => prevUsers.map(u => {
        if (duelsByCreator[u.id]) {
            return { ...u, duelsCreated: Math.max(0, u.duelsCreated - duelsByCreator[u.id]) };
        }
        return u;
    }));
  }, [duels]);

  const activateMultipleDuels = useCallback((duelIds: string[], userKeys: number, userId: string) => {
    const duelsToActivate = duels.filter(d => duelIds.includes(d.id));
    const draftCount = duelsToActivate.filter(d => getStatus(d) === 'DRAFT').length;

    if (userKeys < draftCount * DUEL_CREATION_COST) {
        addNotification({ type: 'KEYS_SPENT', message: 'No tienes suficientes llaves para activar los borradores seleccionados.', link: null });
        return;
    }

    let keysSpent = 0;
    const updatedDuels = duels.map(d => {
        if (duelIds.includes(d.id)) {
            const currentStatus = getStatus(d);
            if (currentStatus === 'DRAFT') {
                keysSpent += DUEL_CREATION_COST;
                addKeyTransaction('SPENT', DUEL_CREATION_COST, `Activación de "${d.title}"`);
                const tempDuel = { ...d, status: 'ACTIVE' as Duel['status'] };
                return { ...tempDuel, status: getStatus(tempDuel) };
            }
            if (['INACTIVE', 'CLOSED'].includes(currentStatus)) {
                const tempDuel = { ...d, status: 'ACTIVE' as Duel['status'] };
                return { ...tempDuel, status: getStatus(tempDuel) };
            }
        }
        return d;
    });

    if (keysSpent > 0) {
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, keys: u.keys - keysSpent } : u));
    }
    setDuels(updatedDuels);
  }, [duels, addNotification, addKeyTransaction]);

  const deactivateMultipleDuels = useCallback((duelIds: string[]) => {
    setDuels(prevDuels => prevDuels.map(d => {
        if (duelIds.includes(d.id) && ['ACTIVE', 'SCHEDULED'].includes(getStatus(d))) {
            return { ...d, status: 'INACTIVE' };
        }
        return d;
    }));
  }, []);


  const resetDuelVotes = useCallback((duelId: string, isOwnerReset: boolean = false) => {
    let duelTitle = '';
    setDuels(prevDuels => prevDuels.map(duel => {
        if (duel.id === duelId) {
          duelTitle = duel.title;
          const resetOptions = duel.options.map(option => ({ ...option, votes: 0 }));
          return { ...duel, options: resetOptions };
        }
        return duel;
    }));
    setVotedDuelIds(prevIds => prevIds.filter(id => id !== duelId));
    setUserVotedOptions(prevVotes => {
        const newVotes = { ...prevVotes };
        delete newVotes[duelId];
        return newVotes;
    });

    const message = isOwnerReset 
        ? `Has reiniciado los votos de tu duelo "${duelTitle}".`
        : `Un administrador ha reiniciado los votos del duelo "${duelTitle}".`;
     addNotification({ type: 'DUEL_RESET', message: message, link: null });
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

  const getAllUsers = useCallback(() => users, [users]);

  const updateUserRole = useCallback((userId: string, newRole: 'ADMIN' | 'USER') => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    setDuels(prevDuels => prevDuels.filter(d => d.creator.id !== userId));
  }, []);
  
  const adjustUserKeys = useCallback((userId: string, amount: number, reason: string) => {
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === userId) {
        const newKeys = Math.max(0, u.keys + amount);
        return { ...u, keys: newKeys };
      }
      return u;
    }))
  }, []);

  const value = { 
    duels, 
    castVote, 
    addDuel, 
    updateDuel, 
    toggleDuelStatus, 
    deleteDuel, 
    deleteMultipleDuels,
    activateMultipleDuels,
    deactivateMultipleDuels,
    resetDuelVotes, 
    votedDuelIds, 
    userVotedOptions,
    getDuelStatus, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    keyHistory,
    activateDraftDuel,
    getAllUsers,
    updateUserRole,
    deleteUser,
    adjustUserKeys,
    apiKey,
    setApiKey,
    isAiEnabled,
    setIsAiEnabled,
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
