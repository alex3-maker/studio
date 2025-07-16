
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import type { User, Duel, Notification, KeyTransaction, UserVote } from '@/lib/types';
import { isAfter, isBefore, parseISO } from 'date-fns';

const VOTED_DUELS_STORAGE_KEY = 'dueliax_voted_duels';
const USER_VOTES_STORAGE_KEY = 'dueliax_user_votes';
const NOTIFICATIONS_STORAGE_KEY = 'dueliax_notifications';
const KEY_HISTORY_STORAGE_KEY = 'dueliax_key_history';
const API_KEY_STORAGE_KEY = 'dueliax_api_key';
const AI_ENABLED_STORAGE_KEY = 'dueliax_ai_enabled';

interface AppContextType {
  duels: Duel[];
  setDuels: Dispatch<SetStateAction<Duel[]>>;
  users: User[];
  setUsers: Dispatch<SetStateAction<User[]>>;
  votedDuelIds: string[];
  userVotedOptions: Record<string, UserVote>;
  notifications: Notification[];
  keyHistory: KeyTransaction[];
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
  // castVote is now a Server Action, so it's not part of the context
  addDuel: (newDuel: Duel, creator: Pick<User, 'id' | 'name' | 'avatarUrl'>) => void;
  updateDuel: (updatedDuel: Partial<Duel> & { id: string }) => void;
  toggleDuelStatus: (duelId: string) => void;
  deleteDuel: (duelId: string) => void;
  deleteMultipleDuels: (duelIds: string[]) => void;
  activateMultipleDuels: (duelIds: string[], userId: string) => void;
  deactivateMultipleDuels: (duelIds: string[]) => void;
  resetDuelVotes: (duelId: string, isAdminReset?: boolean) => void;
  getDuelStatus: (duel: Duel) => Duel['status'];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: (userId: string) => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: (userId: string) => void;
  activateDraftDuel: (duelId: string, userId: string) => boolean;
  getAllUsers: () => User[];
  updateUserRole: (userId: string, newRole: 'ADMIN' | 'USER') => void;
  deleteUser: (userId: string) => void;
  adjustUserKeys: (userId: string, amount: number, reason: string) => void;
  getUserById: (userId: string) => User | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getStatus = (duel: Duel): Duel['status'] => {
    if (!duel) return 'CLOSED';
    if (duel.status === 'INACTIVE') return 'INACTIVE';
    if (duel.status === 'DRAFT') return 'DRAFT';
    
    try {
        const now = new Date();
        const startsAt = duel.startsAt instanceof Date ? duel.startsAt : parseISO(duel.startsAt);
        const endsAt = duel.endsAt instanceof Date ? duel.endsAt : parseISO(duel.endsAt);

        if (isBefore(now, startsAt)) return 'SCHEDULED';
        if (isAfter(now, endsAt)) return 'CLOSED';
        return 'ACTIVE';
    } catch (error) {
        console.error("Error parsing duel dates, defaulting to closed:", duel, error);
        return 'CLOSED';
    }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [votedDuelIds, setVotedDuelIds] = useState<string[]>([]);
  const [userVotedOptions, setUserVotedOptions] = useState<Record<string, UserVote>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [keyHistory, setKeyHistory] = useState<KeyTransaction[]>([]);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isAiEnabled, setAiEnabledState] = useState<boolean>(true);
  
  useEffect(() => {
    // Load only UI-related state from localStorage.
    // Main data (duels, users) is now passed via props from server components.
    try {
      const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedApiKey) setApiKeyState(storedApiKey);
      
      const storedAiEnabled = localStorage.getItem(AI_ENABLED_STORAGE_KEY);
      setAiEnabledState(storedAiEnabled ? JSON.parse(storedAiEnabled) : true);

      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
      
      const storedKeyHistory = localStorage.getItem(KEY_HISTORY_STORAGE_KEY);
      if (storedKeyHistory) setKeyHistory(JSON.parse(storedKeyHistory));
    } catch (error) {
        console.error("Error loading non-critical data from local storage", error);
    }
  }, []);
  
  // Persist UI state to localStorage
  useEffect(() => { localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(KEY_HISTORY_STORAGE_KEY, JSON.stringify(keyHistory)); }, [keyHistory]);


  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  }, []);

  const setIsAiEnabled = useCallback((enabled: boolean) => {
    setAiEnabledState(enabled);
    localStorage.setItem(AI_ENABLED_STORAGE_KEY, JSON.stringify(enabled));
  }, []);


  const addNotification = useCallback((userId: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'userId'>) => {
    const newNotif: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        read: false,
        userId: userId
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

  const addKeyTransaction = useCallback((userId: string, type: 'EARNED' | 'SPENT', amount: number, description: string) => {
    setKeyHistory(prev => [
        {
            id: `key-${Date.now()}`,
            type,
            amount,
            description,
            timestamp: new Date().toISOString(),
            userId: userId
        },
        ...prev
    ].slice(0, 100));
  }, []);
  
  const getDuelStatus = useCallback((duel: Duel): Duel['status'] => getStatus(duel), []);
  
  // These functions are now simulations as real logic is in Server Actions
  // They update the client-side state for immediate UI feedback.
  const addDuel = useCallback((newDuel: Duel) => {
    setDuels(prev => [newDuel, ...prev]);
  }, []);

  const updateDuel = useCallback((updatedDuelData: Partial<Duel> & { id: string }) => {
    setDuels(prev => prev.map(d => d.id === updatedDuelData.id ? { ...d, ...updatedDuelData } : d));
  }, []);

  const toggleDuelStatus = useCallback((duelId: string) => {
     setDuels(prev => prev.map(d => {
       if (d.id === duelId) {
         const currentStatus = getStatus(d);
         const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
         const tempDuel = { ...d, status: newStatus };
         return { ...tempDuel, status: getStatus(tempDuel) };
       }
       return d;
     }));
  }, []);

  const deleteDuel = useCallback((duelId: string) => {
    setDuels(prev => prev.filter(d => d.id !== duelId));
  }, []);
  
  const deleteMultipleDuels = useCallback((duelIds: string[]) => {
    setDuels(prev => prev.filter(d => !duelIds.includes(d.id)));
  }, []);

  const activateMultipleDuels = (duelIds: string[], userId: string) => { console.warn("activateMultipleDuels needs to be a server action") };
  const deactivateMultipleDuels = (duelIds: string[]) => { console.warn("deactivateMultipleDuels needs to be a server action") };

  const resetDuelVotes = (duelId: string, isAdminReset?: boolean) => {
    setDuels(prev => prev.map(d => {
      if (d.id === duelId) {
        return { ...d, options: d.options.map(o => ({ ...o, votes: 0 })) };
      }
      return d;
    }));
  };

  const activateDraftDuel = (duelId: string, userId: string): boolean => {
    console.warn("activateDraftDuel should be a server action");
    return false; // This must be a server action now to check keys and spend them.
  }

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, read: true} : n));
  }, []);

  const markAllNotificationsAsRead = useCallback((userId: string) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? {...n, read: true} : n));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback((userId: string) => {
    setNotifications(prev => prev.filter(n => n.userId !== userId));
  }, []);

  const getAllUsers = useCallback(() => users, [users]);
  const getUserById = useCallback((userId: string) => users.find(u => u.id === userId), [users]);
  const updateUserRole = (userId: string, newRole: 'ADMIN' | 'USER') => { console.warn("updateUserRole needs to be a server action") };
  const deleteUser = (userId: string) => { console.warn("deleteUser needs to be a server action") };
  const adjustUserKeys = (userId: string, amount: number, reason: string) => { console.warn("adjustUserKeys needs to be a server action") };

  const value: AppContextType = { 
    duels,
    setDuels,
    users,
    setUsers,
    votedDuelIds, 
    userVotedOptions,
    notifications, 
    keyHistory,
    apiKey,
    setApiKey,
    isAiEnabled,
    setIsAiEnabled,
    addDuel: addDuel as any,
    updateDuel, 
    toggleDuelStatus, 
    deleteDuel, 
    deleteMultipleDuels,
    activateMultipleDuels,
    deactivateMultipleDuels,
    resetDuelVotes, 
    getDuelStatus, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    activateDraftDuel,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    adjustUserKeys,
  };

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
