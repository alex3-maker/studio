
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import type { User, Duel, DuelOption, Notification, KeyTransaction, UserVote } from '@/lib/types';
import { isAfter, isBefore, parseISO, formatISO } from 'date-fns';
import { castVoteAction } from '@/lib/actions';

const VOTED_DUELS_STORAGE_KEY = 'dueliax_voted_duels';
const USER_VOTES_STORAGE_KEY = 'dueliax_user_votes';
const NOTIFICATIONS_STORAGE_KEY = 'dueliax_notifications';
const KEY_HISTORY_STORAGE_KEY = 'dueliax_key_history';
const API_KEY_STORAGE_KEY = 'dueliax_api_key';
const AI_ENABLED_STORAGE_KEY = 'dueliax_ai_enabled';
const DUEL_CREATION_COST = 5;

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
  castVote: (duelId: string, optionId: string, userId?: string) => Promise<{ awardedKey: boolean; updatedDuel: Duel | null; error?: string, voteRegistered?: boolean }>;
  addDuel: (newDuel: Omit<Duel, 'id' | 'creator' | 'createdAt' | 'status'>, creator: Pick<User, 'id' | 'name' | 'avatarUrl'>) => Duel;
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
  const [users, setUsers] = useState<User[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [votedDuelIds, setVotedDuelIds] = useState<string[]>([]);
  const [userVotedOptions, setUserVotedOptions] = useState<Record<string, UserVote>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [keyHistory, setKeyHistory] = useState<KeyTransaction[]>([]);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isAiEnabled, setAiEnabledState] = useState<boolean>(true);
  
  useEffect(() => {
    try {
      const storedVotedIds = localStorage.getItem(VOTED_DUELS_STORAGE_KEY);
      if (storedVotedIds) setVotedDuelIds(JSON.parse(storedVotedIds));

      const storedUserVotes = localStorage.getItem(USER_VOTES_STORAGE_KEY);
      if (storedUserVotes) setUserVotedOptions(JSON.parse(storedUserVotes));
        
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
  
  // Persist state to localStorage
  useEffect(() => { localStorage.setItem(VOTED_DUELS_STORAGE_KEY, JSON.stringify(votedDuelIds)); }, [votedDuelIds]);
  useEffect(() => { localStorage.setItem(USER_VOTES_STORAGE_KEY, JSON.stringify(userVotedOptions)); }, [userVotedOptions]);
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
  
  const spendKeys = useCallback((userId: string, amount: number, description: string) => {
    console.warn("spendKeys should be a server action");
    let success = false;
    setUsers(prevUsers => {
        const newUsers = prevUsers.map(u => {
            if (u.id === userId && u.keys >= amount) {
                success = true;
                addKeyTransaction(userId, 'SPENT', amount, description);
                addNotification(userId, {
                  type: 'KEYS_SPENT',
                  message: `Has gastado ${amount} llaves en: ${description}.`,
                  link: null,
                });
                return {...u, keys: u.keys - amount};
            }
            return u;
        })
        return newUsers;
    });
    return success;
  }, [addKeyTransaction, addNotification]);

  const castVote = useCallback(async (duelId: string, optionId: string, userId?: string): Promise<{ awardedKey: boolean; updatedDuel: Duel | null; error?: string, voteRegistered?: boolean }> => {
    const result = await castVoteAction(duelId, optionId);

    if (result.error) {
      return { ...result, awardedKey: false, updatedDuel: null };
    }
    
    if (result.updatedDuel) {
        setDuels(prevDuels => {
           const newDuels = prevDuels.map(d => d.id === duelId ? result.updatedDuel! : d);
           return newDuels;
        });
        setVotedDuelIds(prev => [...prev, duelId]);

        if (result.awardedKey && userId) {
            setUsers(prevUsers => {
                const newUsers = prevUsers.map(u => {
                    if (u.id === userId) {
                        addKeyTransaction(userId, 'EARNED', 1, `Voto en "${result.updatedDuel!.title}"`);
                        return { ...u, votesCast: u.votesCast + 1, keys: u.keys + 1 };
                    }
                    return u;
                })
                return newUsers;
            });
        }

        if (userId) {
            setUserVotedOptions(prevVotes => ({
                ...prevVotes,
                [duelId]: { optionId, timestamp: new Date().toISOString() },
            }));
        }
    }

    return result;
  }, [addKeyTransaction]);

  const addDuel = useCallback((newDuelData: Omit<Duel, 'id' | 'creator' | 'createdAt' | 'status'>, creator: Pick<User, 'id' | 'name' | 'avatarUrl'>): Duel => {
    console.warn("addDuel should be a server action");
    const creatorUser = users.find(u => u.id === creator.id);
    if (!creatorUser) throw new Error("Creator not found");
    
    const hasEnoughKeys = creatorUser.keys >= DUEL_CREATION_COST;
    const initialStatus = hasEnoughKeys ? 'SCHEDULED' : 'DRAFT'; 
    const status = getStatus({ ...newDuelData, status: initialStatus } as Duel);
    
    const newDuel: Duel = { 
      ...newDuelData, 
      id: `duel-${Date.now()}-${Math.random()}`,
      creator: creator,
      createdAt: formatISO(new Date()),
      status 
    };

    setDuels(prevDuels => {
      const newDuels = [newDuel, ...prevDuels];
      return newDuels;
    });
    
    if (status !== 'DRAFT') {
        spendKeys(creator.id, DUEL_CREATION_COST, `Creación de "${newDuelData.title}"`);
    }
    
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(u => u.id === creator.id ? {...u, duelsCreated: u.duelsCreated + 1 } : u);
      return newUsers;
    });

    return newDuel;
  }, [users, spendKeys]);

  const activateDraftDuel = useCallback((duelId: string, userId: string): boolean => {
    console.warn("activateDraftDuel should be a server action");
    const duel = duels.find(d => d.id === duelId);
    const user = users.find(u => u.id === userId);
    if (!duel || !user || duel.status !== 'DRAFT' || user.keys < DUEL_CREATION_COST) return false;
    
    const success = spendKeys(userId, DUEL_CREATION_COST, `Activación de "${duel.title}"`);
    if (success) {
      setDuels(prevDuels => {
          const newDuels = prevDuels.map(d => d.id === duelId ? { ...d, status: getStatus({ ...d, status: 'ACTIVE' } as Duel) } : d);
          return newDuels;
      });
    }
    return success;
  }, [duels, users, spendKeys]);

  const updateDuel = useCallback((updatedDuelData: Partial<Duel> & { id: string }) => {
    console.warn("updateDuel should be a server action");
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(duel => {
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
          
          const potentiallyUpdatedDuel = { ...duel, ...updatedDuelData, options: updatedOptions || duel.options };
          if (updatedDuelData.startsAt || updatedDuelData.endsAt) {
            return { ...potentiallyUpdatedDuel, status: getStatus(potentiallyUpdatedDuel) };
          }
          return potentiallyUpdatedDuel;
        }
        return duel;
      })
      return newDuels;
    });
  }, []);

  const toggleDuelStatus = useCallback((duelId: string) => {
    console.warn("toggleDuelStatus should be a server action");
    let notificationMessage = '';
    let duelToNotify: Duel | undefined;
    
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(duel => {
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
          duelToNotify = { ...tempDuel, status: getStatus(tempDuel) };
          return duelToNotify;
        }
        return duel;
      })
      return newDuels;
    });

    if (notificationMessage && duelToNotify) {
        addNotification(duelToNotify.creator.id, {
            type: 'DUEL_EDITED',
            message: notificationMessage,
            link: `/`
        });
    }
  }, [addNotification]);


  const deleteDuel = useCallback((duelId: string) => {
    console.warn("deleteDuel should be a server action");
    const duelToDelete = duels.find(d => d.id === duelId);
    if (!duelToDelete) return;
    
    setDuels(prevDuels => {
      const newDuels = prevDuels.filter(duel => duel.id !== duelId);
      return newDuels;
    });
    
    setUsers(prevUsers => {
        const newUsers = prevUsers.map(u => {
            if (u.id === duelToDelete.creator.id) {
                return { ...u, duelsCreated: Math.max(0, u.duelsCreated - 1) };
            }
            return u;
        })
        return newUsers;
    });
  }, [duels]);
  
  const deleteMultipleDuels = useCallback((duelIds: string[]) => {
    console.warn("deleteMultipleDuels should be a server action");
    const duelsToDelete = duels.filter(d => duelIds.includes(d.id));
    if (duelsToDelete.length === 0) return;

    setDuels(prevDuels => {
      const newDuels = prevDuels.filter(duel => !duelIds.includes(duel.id));
      return newDuels;
    });

    const duelsByCreator = duelsToDelete.reduce((acc, duel) => {
        acc[duel.creator.id] = (acc[duel.creator.id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    setUsers(prevUsers => {
        const newUsers = prevUsers.map(u => {
            if (duelsByCreator[u.id]) {
                return { ...u, duelsCreated: Math.max(0, u.duelsCreated - duelsByCreator[u.id]) };
            }
            return u;
        })
        return newUsers;
    });
  }, [duels]);

  const activateMultipleDuels = useCallback((duelIds: string[], userId: string) => {
    console.warn("activateMultipleDuels should be a server action");
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const duelsToActivate = duels.filter(d => duelIds.includes(d.id));
    const draftCount = duelsToActivate.filter(d => getStatus(d) === 'DRAFT').length;

    if (user.keys < draftCount * DUEL_CREATION_COST) {
        addNotification(userId, { type: 'KEYS_SPENT', message: 'No tienes suficientes llaves para activar los borradores seleccionados.', link: null });
        return;
    }

    let keysSpent = 0;
    const updatedDuels = duels.map(d => {
        if (duelIds.includes(d.id)) {
            const currentStatus = getStatus(d);
            if (currentStatus === 'DRAFT') {
                keysSpent += DUEL_CREATION_COST;
                addKeyTransaction(userId, 'SPENT', DUEL_CREATION_COST, `Activación de "${d.title}"`);
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
      setUsers(prevUsers => {
        const newUsers = prevUsers.map(u => u.id === userId ? { ...u, keys: u.keys - keysSpent } : u);
        return newUsers;
      });
    }
    setDuels(updatedDuels);
  }, [duels, users, addNotification, addKeyTransaction]);

  const deactivateMultipleDuels = useCallback((duelIds: string[]) => {
    console.warn("deactivateMultipleDuels should be a server action");
    setDuels(prevDuels => {
      const newDuels = prevDuels.map(d => {
          if (duelIds.includes(d.id) && ['ACTIVE', 'SCHEDULED'].includes(getStatus(d))) {
              return { ...d, status: 'INACTIVE' };
          }
          return d;
      });
      return newDuels;
    });
  }, []);


  const resetDuelVotes = useCallback((duelId: string, isOwnerReset: boolean = false) => {
    console.warn("resetDuelVotes should be a server action");
    let duelToNotify: Duel | undefined;
    setDuels(prevDuels => {
        const newDuels = prevDuels.map(duel => {
          if (duel.id === duelId) {
            duelToNotify = duel;
            const resetOptions = duel.options.map(option => ({ ...option, votes: 0 }));
            return { ...duel, options: resetOptions };
          }
          return duel;
        })
        return newDuels;
    });
    
    const updatedUserVotes = { ...userVotedOptions };
    Object.keys(updatedUserVotes).forEach(dId => {
      if (dId === duelId) {
        delete updatedUserVotes[dId];
      }
    });
    setUserVotedOptions(updatedUserVotes);
    
    setVotedDuelIds(prevIds => prevIds.filter(id => id !== duelId));

    if (duelToNotify) {
      const message = isOwnerReset 
          ? `Has reiniciado los votos de tu duelo "${duelToNotify.title}".`
          : `Un administrador ha reiniciado los votos del duelo "${duelToNotify.title}".`;
      addNotification(duelToNotify.creator.id, { type: 'DUEL_RESET', message: message, link: null });
    }
  }, [addNotification, userVotedOptions]);

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

  const getAllUsers = useCallback(() => {
    return users
  }, [users]);
  const getUserById = useCallback((userId: string) => {
    return users.find(u => u.id === userId)
  }, [users]);

  const updateUserRole = useCallback((userId: string, newRole: 'ADMIN' | 'USER') => {
    console.warn("updateUserRole should be a server action");
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u);
      return newUsers;
    });
  }, []);

  const deleteUser = useCallback((userId: string) => {
    console.warn("deleteUser should be a server action");
    setUsers(prevUsers => {
      const newUsers = prevUsers.filter(u => u.id !== userId);
      return newUsers;
    });
    setDuels(prevDuels => {
      const newDuels = prevDuels.filter(d => d.creator.id !== userId);
      return newDuels;
    });
  }, []);
  
  const adjustUserKeys = useCallback((userId: string, amount: number, reason: string) => {
    console.warn("adjustUserKeys should be a server action");
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(u => {
        if (u.id === userId) {
          const newKeys = Math.max(0, u.keys + amount);
          const transactionType = amount > 0 ? 'EARNED' : 'SPENT';
          addKeyTransaction(userId, transactionType, Math.abs(amount), reason);
          return { ...u, keys: newKeys };
        }
        return u;
      })
      return newUsers;
    })
  }, [addKeyTransaction]);

  const value = { 
    duels,
    setDuels,
    users,
    setUsers,
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
    getUserById,
    updateUserRole,
    deleteUser,
    adjustUserKeys,
    apiKey,
    setApiKey,
    isAiEnabled,
    setIsAiEnabled,
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
