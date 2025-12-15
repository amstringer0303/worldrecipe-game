import { create } from 'zustand';
import { usePlayerStore } from './playerStore';
import { useGameStore } from './gameStore';
import { useWorldStore } from './worldStore';

// ============================================
// Save Store - Handles game persistence
// ============================================

interface SaveState {
  // Save status
  saveId: string | null;
  lastSaveTime: number | null;
  isSaving: boolean;
  isLoading: boolean;
  autoSaveEnabled: boolean;
  autoSaveIntervalId: NodeJS.Timeout | null;
  
  // Actions
  setSaveId: (id: string) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  
  // Core save/load functions
  saveGame: () => Promise<boolean>;
  loadGame: (saveId?: string) => Promise<boolean>;
  loadLatestSave: (worldId: string) => Promise<boolean>;
  
  // Autosave management
  startAutoSave: (intervalMs?: number) => void;
  stopAutoSave: () => void;
  
  // Helper to get full save data
  getSaveData: () => SaveData;
  
  // Restore from save data
  restoreFromSave: (data: SaveData) => void;
}

interface SaveData {
  worldId: string;
  saveId?: string;
  
  // Player state
  playerPosition: [number, number, number];
  playerRotation: number;
  currentRegionId: string;
  
  // Inventory
  inventory: any[];
  
  // Quests
  activeQuests: any[];
  completedQuestIds: string[];
  
  // Relationships
  npcRelationships: Record<string, number>;
  
  // Cooking progress
  completedCookingSteps: string[];
  unlockedTechniques: string[];
  
  // Collected items
  collectedItemIds: string[];
  
  // NPC memory
  npcConversationMemory: Record<string, string[]>;
  
  // Time
  timeOfDay: string;
  dayNumber: number;
  gameTimeSeconds: number;
  playTimeSeconds: number;
  
  // Stats
  stamina: number;
}

export const useSaveStore = create<SaveState>((set, get) => ({
  saveId: null,
  lastSaveTime: null,
  isSaving: false,
  isLoading: false,
  autoSaveEnabled: true,
  autoSaveIntervalId: null,
  
  setSaveId: (id) => set({ saveId: id }),
  setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
  
  getSaveData: () => {
    const playerState = usePlayerStore.getState();
    const gameState = useGameStore.getState();
    const worldState = useWorldStore.getState();
    
    return {
      worldId: worldState.world?.worldId || '',
      saveId: get().saveId || undefined,
      
      playerPosition: playerState.position,
      playerRotation: playerState.rotation,
      currentRegionId: worldState.currentRegionId || '',
      
      inventory: playerState.inventory,
      activeQuests: playerState.activeQuests,
      completedQuestIds: playerState.completedQuestIds,
      
      npcRelationships: playerState.npcRelationships,
      
      completedCookingSteps: playerState.completedCookingSteps,
      unlockedTechniques: playerState.unlockedTechniques,
      
      collectedItemIds: playerState.collectedItemIds,
      npcConversationMemory: playerState.npcConversationMemory,
      
      timeOfDay: gameState.timeOfDay,
      dayNumber: gameState.dayNumber,
      gameTimeSeconds: gameState.gameTimeSeconds,
      playTimeSeconds: gameState.playTimeSeconds,
      
      stamina: playerState.stamina,
    };
  },
  
  saveGame: async () => {
    const { isSaving } = get();
    if (isSaving) return false;
    
    set({ isSaving: true });
    
    try {
      const saveData = get().getSaveData();
      
      if (!saveData.worldId) {
        console.warn('Cannot save: no world loaded');
        return false;
      }
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save game');
      }
      
      const result = await response.json();
      
      set({ 
        saveId: result.saveId,
        lastSaveTime: Date.now(),
      });
      
      console.log('Game saved successfully:', result.saveId);
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },
  
  loadGame: async (saveId) => {
    set({ isLoading: true });
    
    try {
      const url = saveId 
        ? `/api/save?saveId=${saveId}` 
        : '/api/save';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load save');
      }
      
      const data = await response.json();
      
      if (data.save) {
        get().restoreFromSave(data.save);
        set({ saveId: data.save.saveId });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Load failed:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadLatestSave: async (worldId) => {
    set({ isLoading: true });
    
    try {
      const response = await fetch(`/api/save?worldId=${worldId}`);
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      
      // Get the most recent save for this world
      if (data.saves && data.saves.length > 0) {
        const latestSave = data.saves[0]; // Assuming sorted by date desc
        
        // Fetch the full save data
        const saveResponse = await fetch(`/api/save?saveId=${latestSave.saveId}`);
        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          if (saveData.save) {
            get().restoreFromSave(saveData.save);
            set({ saveId: saveData.save.saveId });
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Load latest save failed:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  restoreFromSave: (data: SaveData) => {
    const playerStore = usePlayerStore.getState();
    const gameStore = useGameStore.getState();
    const worldStore = useWorldStore.getState();
    
    // Restore player state
    playerStore.restoreState({
      position: data.playerPosition,
      rotation: data.playerRotation,
      inventory: data.inventory,
      activeQuests: data.activeQuests,
      completedQuestIds: data.completedQuestIds,
      npcRelationships: data.npcRelationships,
      completedCookingSteps: data.completedCookingSteps,
      unlockedTechniques: data.unlockedTechniques,
      collectedItemIds: data.collectedItemIds,
      npcConversationMemory: data.npcConversationMemory,
      stamina: data.stamina,
    });
    
    // Restore game state
    if (data.timeOfDay) {
      gameStore.setTimeOfDay(data.timeOfDay as any);
    }
    
    // Restore region
    if (data.currentRegionId && worldStore.world) {
      worldStore.setCurrentRegion(data.currentRegionId);
    }
    
    console.log('Game state restored from save');
  },
  
  startAutoSave: (intervalMs = 60000) => {
    const { autoSaveIntervalId, autoSaveEnabled } = get();
    
    // Clear existing interval
    if (autoSaveIntervalId) {
      clearInterval(autoSaveIntervalId);
    }
    
    if (!autoSaveEnabled) return;
    
    const id = setInterval(() => {
      const gameState = useGameStore.getState();
      
      // Only autosave if playing and not paused
      if (gameState.isPlaying && !gameState.isPaused) {
        get().saveGame();
      }
    }, intervalMs);
    
    set({ autoSaveIntervalId: id });
    console.log('Autosave started, interval:', intervalMs);
  },
  
  stopAutoSave: () => {
    const { autoSaveIntervalId } = get();
    
    if (autoSaveIntervalId) {
      clearInterval(autoSaveIntervalId);
      set({ autoSaveIntervalId: null });
      console.log('Autosave stopped');
    }
  },
}));

// Helper hook for save status
export function useSaveStatus() {
  const isSaving = useSaveStore((s) => s.isSaving);
  const lastSaveTime = useSaveStore((s) => s.lastSaveTime);
  
  return { isSaving, lastSaveTime };
}

