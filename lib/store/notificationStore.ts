import { create } from 'zustand';

// ============================================
// Notification Store - Toast and event notifications
// ============================================

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'quest_accepted' 
  | 'quest_completed' 
  | 'objective_completed'
  | 'item_collected'
  | 'relationship_up'
  | 'autosave';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  icon?: string;
  duration?: number; // ms, default 3000
  createdAt: number;
}

interface NotificationState {
  notifications: Notification[];
  maxNotifications: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Convenience methods
  showInfo: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showQuestAccepted: (questTitle: string) => void;
  showQuestCompleted: (questTitle: string) => void;
  showObjectiveCompleted: (objectiveDescription: string) => void;
  showItemCollected: (itemName: string, quantity?: number) => void;
  showRelationshipUp: (npcName: string) => void;
  showAutosave: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  maxNotifications: 5,
  
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration || 3000,
    };
    
    set((state) => ({
      notifications: [
        ...state.notifications.slice(-(state.maxNotifications - 1)),
        newNotification,
      ],
    }));
    
    // Auto-remove after duration
    setTimeout(() => {
      get().removeNotification(id);
    }, newNotification.duration);
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  },
  
  // Convenience methods
  showInfo: (title, message) => {
    get().addNotification({ type: 'info', title, message, icon: 'ℹ️' });
  },
  
  showSuccess: (title, message) => {
    get().addNotification({ type: 'success', title, message, icon: '✅' });
  },
  
  showError: (title, message) => {
    get().addNotification({ type: 'error', title, message, icon: '❌', duration: 5000 });
  },
  
  showQuestAccepted: (questTitle) => {
    get().addNotification({
      type: 'quest_accepted',
      title: 'New Quest!',
      message: questTitle,
      icon: '📜',
      duration: 4000,
    });
  },
  
  showQuestCompleted: (questTitle) => {
    get().addNotification({
      type: 'quest_completed',
      title: 'Quest Complete!',
      message: questTitle,
      icon: '🏆',
      duration: 5000,
    });
  },
  
  showObjectiveCompleted: (objectiveDescription) => {
    get().addNotification({
      type: 'objective_completed',
      title: 'Objective Complete',
      message: objectiveDescription,
      icon: '✓',
      duration: 2500,
    });
  },
  
  showItemCollected: (itemName, quantity = 1) => {
    get().addNotification({
      type: 'item_collected',
      title: quantity > 1 ? `+${quantity} ${itemName}` : `+${itemName}`,
      icon: '🎒',
      duration: 2000,
    });
  },
  
  showRelationshipUp: (npcName) => {
    get().addNotification({
      type: 'relationship_up',
      title: 'Friendship Increased!',
      message: npcName,
      icon: '❤️',
      duration: 2500,
    });
  },
  
  showAutosave: () => {
    get().addNotification({
      type: 'autosave',
      title: 'Game Saved',
      icon: '💾',
      duration: 2000,
    });
  },
}));

// Helper hook to get notifications
export function useNotifications() {
  return useNotificationStore((s) => s.notifications);
}

