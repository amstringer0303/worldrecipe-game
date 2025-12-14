import { create } from 'zustand';
import type { WorldRecipe, RegionSpec, NPC, QuestArc, IngredientGraph } from '@/types/game';

// ============================================
// World Store - World data and region management
// ============================================

interface WorldState {
  // World data
  world: WorldRecipe | null;
  isLoading: boolean;
  error: string | null;
  
  // Current region
  currentRegionId: string | null;
  currentRegion: RegionSpec | null;
  
  // Computed helpers
  getNPC: (npcId: string) => NPC | undefined;
  getQuestArc: (arcId: string) => QuestArc | undefined;
  getRegion: (regionId: string) => RegionSpec | undefined;
  
  // Actions
  setWorld: (world: WorldRecipe) => void;
  setCurrentRegion: (regionId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async actions
  loadWorld: (worldId: string) => Promise<void>;
  generateWorld: (dishPrompt: string, seed?: string) => Promise<WorldRecipe>;
  
  reset: () => void;
}

const initialState = {
  world: null,
  isLoading: false,
  error: null,
  currentRegionId: null,
  currentRegion: null,
};

export const useWorldStore = create<WorldState>((set, get) => ({
  ...initialState,
  
  getNPC: (npcId) => {
    const { world } = get();
    return world?.npcRoster.find(n => n.npcId === npcId);
  },
  
  getQuestArc: (arcId) => {
    const { world } = get();
    return world?.questArcs.find(a => a.arcId === arcId);
  },
  
  getRegion: (regionId) => {
    const { world } = get();
    return world?.regions.find(r => r.regionId === regionId);
  },
  
  setWorld: (world) => {
    const firstRegion = world.regions[0];
    set({
      world,
      currentRegionId: firstRegion?.regionId ?? null,
      currentRegion: firstRegion ?? null,
      error: null,
    });
  },
  
  setCurrentRegion: (regionId) => {
    const { world } = get();
    if (!world) return;
    
    const region = world.regions.find(r => r.regionId === regionId);
    if (region) {
      set({ currentRegionId: regionId, currentRegion: region });
    }
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  loadWorld: async (worldId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/ai/world?worldId=${worldId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load world');
      }
      
      const data = await response.json();
      get().setWorld(data.world);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  generateWorld: async (dishPrompt, seed) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/ai/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishPrompt, seed }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate world');
      }
      
      const data = await response.json();
      get().setWorld(data.world);
      return data.world;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  reset: () => set(initialState),
}));

