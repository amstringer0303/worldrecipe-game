'use client';

import { useNotificationStore, type Notification, type NotificationType } from '@/lib/store/notificationStore';
import { useSaveStore } from '@/lib/store/saveStore';

// ============================================
// Toast Notification Component
// ============================================

const typeStyles: Record<NotificationType, { bg: string; border: string; text: string }> = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-200',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-200',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-200',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-200',
  },
  quest_accepted: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-200',
  },
  quest_completed: {
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    text: 'text-purple-200',
  },
  objective_completed: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-200',
  },
  item_collected: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-200',
  },
  relationship_up: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-200',
  },
  autosave: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-300',
  },
};

function Toast({ notification }: { notification: Notification }) {
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const styles = typeStyles[notification.type];
  
  return (
    <div
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        backdrop-blur-md border rounded-lg px-4 py-3 shadow-lg
        flex items-center gap-3
        animate-in slide-in-from-right-full fade-in duration-300
        min-w-[200px] max-w-[350px]
      `}
      onClick={() => removeNotification(notification.id)}
    >
      {notification.icon && (
        <span className="text-xl flex-shrink-0">{notification.icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{notification.title}</p>
        {notification.message && (
          <p className="text-xs opacity-80 truncate">{notification.message}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Toast Container
// ============================================

export function ToastContainer() {
  const notifications = useNotificationStore((s) => s.notifications);
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Toast notification={notification} />
        </div>
      ))}
    </div>
  );
}

// ============================================
// Autosave Indicator
// ============================================

export function AutosaveIndicator() {
  const isSaving = useSaveStore((s) => s.isSaving);
  const lastSaveTime = useSaveStore((s) => s.lastSaveTime);
  
  if (!isSaving && !lastSaveTime) return null;
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-black/50 backdrop-blur-sm border border-white/10
        text-xs text-white/70
        transition-opacity duration-300
        ${isSaving ? 'opacity-100' : 'opacity-50'}
      `}>
        {isSaving ? (
          <>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span>Saving...</span>
          </>
        ) : lastSaveTime ? (
          <>
            <span>💾</span>
            <span>Saved {formatTime(lastSaveTime)}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default ToastContainer;

