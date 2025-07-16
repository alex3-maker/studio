
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { User, Duel, DuelOption, Notification, KeyTransaction, UserVote } from '@/lib/types';
import { mockUser, mockDuels, mockUsers } from '@/lib/data';
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
  user: User;
  duels: Duel[];
  votedDuelIds: string[];
  userVotedOptions: Record<string, UserVote>;
  notifications: Notification[];
  keyHistory: KeyTransaction[];
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
  castVote: (duelId: string, optionId: string) => boolean;
  addDuel: (newDuel: Duel) => void;
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
  getAllUsers: () => User[];
  updateUserRole: (userId: string, newRole: 'admin' | 'user') => void;
  deleteUser: (userId: string) => void;
  adjustUserKeys: (userId: string, amount: number, reason: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getStatus = (duel: Duel): Duel['status'] => {
    if (!duel) return 'closed';
    if (duel.status === 'inactive') return 'inactive'; // Respect manual override
    if (duel.status === 'draft') return 'draft';
    
    try {
        const now = new Date();
        const startsAt = parseISO(duel.startsAt);
        const endsAt = parseISO(duel.endsAt);

        if (isBefore(now, startsAt)) return 'scheduled';
        if (isAfter(now, endsAt)) return 'closed';
        return 'active';
    } catch (error) {
        console.error("Error parsing duel dates, defaulting to closed:", duel, error);
        return 'closed';
    }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
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
  
  const persistUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users.map(u => u.id === updatedUser.id ? updatedUser : u)));
  }, [users]);
  
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
      
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
       if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
        setUsers(mockUsers);
      }
      
      const currentUserId = localStorage.getItem(CURRENT_USER_ID_KEY) || mockUser.id;
      const allUsers = storedUsers ? JSON.parse(storedUsers) : mockUsers;
      const currentUserData = allUsers.find((u: User) => u.id === currentUserId) || mockUser;
      setUser(currentUserData);
      
      if(!localStorage.getItem(CURRENT_USER_ID_KEY)) {
        localStorage.setItem(CURRENT_USER_ID_KEY, mockUser.id);
      }

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
      setUser(mockUser);
      setUsers(mockUsers);
      setDuels(mockDuels);
    }
    setIsLoaded(true);
  }, []);
  
  // Persist state changes to localStorage
  useEffect(() => {
    if (isLoaded) localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
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


  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif = {
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
        return [newNotif, ...prev].slice(0, 50);
    });
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
    const updatedUser = { ...user, keys: user.keys - amount };
    if (user.keys >= amount) {
        persistUser(updatedUser);
        addKeyTransaction('spent', amount, description);
        addNotification({
          type: 'keys-spent',
          message: `Has gastado ${amount} llaves en: ${description}.`,
          link: null,
        });
        success = true;
    }
    return success;
  }, [user, persistUser, addKeyTransaction, addNotification]);

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
    
    persistUser({
        ...user,
        votesCast: user.votesCast + 1,
        keys: awardedKey ? user.keys + 1 : user.keys,
    });

    setVotedDuelIds(prevIds => [...prevIds, duelId]);
    setUserVotedOptions(prevVotes => ({
        ...prevVotes,
        [duelId]: { optionId, timestamp: new Date().toISOString() },
    }));

    return awardedKey;

  }, [duels, duelVotingHistory, user, persistUser, addKeyTransaction]);

  const addDuel = useCallback((newDuelData: Duel) => {
    const hasEnoughKeys = user.keys >= DUEL_CREATION_COST;
    const status = getStatus({ ...newDuelData, status: hasEnoughKeys ? 'active' : 'draft' });
    
    const newDuelWithStatus = { ...newDuelData, status };

    setDuels(prevDuels => [newDuelWithStatus, ...prevDuels]);
    
    if (status !== 'draft') {
        spendKeys(DUEL_CREATION_COST, `Creación de "${newDuelData.title}"`);
    }
    
    persistUser({ ...user, duelsCreated: user.duelsCreated + 1 });
  }, [user, spendKeys, persistUser]);

  const activateDraftDuel = useCallback((duelId: string): boolean => {
    const duel = duels.find(d => d.id === duelId);
    if (!duel || duel.status !== 'draft') return false;
    
    if (!spendKeys(DUEL_CREATION_COST, `Activación de "${duel.title}"`)) return false; 

    setDuels(prevDuels => prevDuels.map(d => 
        d.id === duelId ? { ...d, status: getStatus({ ...d, status: 'active' }) } : d
    ));
    return true;
  }, [duels, spendKeys]);

  const updateDuel = useCallback((updatedDuelData: Partial<Duel> & { id: string }) => {
    setDuels(prevDuels => prevDuels.map(duel => {
        if (duel.id === updatedDuelData.id) {
          const originalOptions = duel.options;
          const updatedOptions = updatedDuelData.options?.map((opt, index) => {
              const originalOption = originalOptions.find(o => o.id === opt.id) || originalOptions[index];
              return { ...originalOption, ...opt };
          }) as [DuelOption, DuelOption] | undefined;

          return { ...duel, ...updatedDuelData, options: updatedOptions || duel.options };
        }
        return duel;
      })
    );
  }, []);

  const toggleDuelStatus = useCallback((duelId: string) => {
    let notificationMessage = '';
    setDuels(prevDuels => prevDuels.map(duel => {
      if (duel.id === duelId) {
        const currentStatus = getStatus(duel);
        let newStatus: Duel['status'];
        if (currentStatus === 'active') {
          newStatus = 'inactive';
          notificationMessage = `El duelo "${duel.title}" ha sido desactivado.`;
        } else {
          newStatus = 'active'; // Force re-evaluation
          notificationMessage = `El duelo "${duel.title}" ha sido activado de nuevo.`;
        }
        return { ...duel, status: newStatus };
      }
      return duel;
    }));
     if (notificationMessage) {
        addNotification({
            type: 'duel-edited',
            message: notificationMessage,
            link: `/`
        });
    }
  }, [addNotification]);


  const deleteDuel = useCallback((duelId: string) => {
    const duelToDelete = duels.find(d => d.id === duelId);
    if (!duelToDelete) return;
    
    setDuels(prevDuels => prevDuels.filter(duel => duel.id !== duelId));
    
    const creator = users.find(u => u.id === duelToDelete.creator.id);
    if (creator) {
      const updatedCreator = { ...creator, duelsCreated: Math.max(0, creator.duelsCreated - 1) };
      setUsers(prevUsers => prevUsers.map(u => u.id === creator.id ? updatedCreator : u));
      if (creator.id === user.id) {
        setUser(updatedCreator);
      }
    }
  }, [duels, users, user.id]);
  
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
    setUserVotedOptions(prevVotes => {
        const newVotes = { ...prevVotes };
        delete newVotes[duelId];
        return newVotes;
    });

    const message = isOwnerReset 
        ? `Has reiniciado los votos de tu duelo "${duelTitle}".`
        : `Un administrador ha reiniciado los votos del duelo "${duelTitle}".`;
     addNotification({ type: 'duel-reset', message: message, link: null });
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

  const updateUserRole = useCallback((userId: string, newRole: 'admin' | 'user') => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    // Also delete their duels
    setDuels(prevDuels => prevDuels.filter(d => d.creator.id !== userId));
  }, []);
  
  const adjustUserKeys = useCallback((userId: string, amount: number, reason: string) => {
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === userId) {
        const newKeys = Math.max(0, u.keys + amount);
        const transactionType = amount > 0 ? 'earned' : 'spent';
        // We can add a global key history or user-specific one later if needed
        // For now, just update the user.
        if (u.id === user.id) {
          setUser({ ...u, keys: newKeys });
        }
        return { ...u, keys: newKeys };
      }
      return u;
    }))
  }, [user.id]);

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
