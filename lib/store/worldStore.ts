import { create } from 'zustand';
import type { WorldRecipe, RegionSpec, NPC, QuestArc, QuestChapter, IngredientGraph } from '@/types/game';

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
  getPortalNPC: (npcId: string) => NPC | undefined;
  getQuestArc: (arcId: string) => QuestArc | undefined;
  getRegion: (regionId: string) => RegionSpec | undefined;
  
  // Quest helpers
  getAvailableQuestsForNPC: (
    npcId: string, 
    activeQuestIds: string[], 
    completedQuestIds: string[]
  ) => QuestChapter[];
  getQuestChapter: (questId: string) => QuestChapter | undefined;
  getNPCsWhoCanGiveQuests: (activeQuestIds: string[], completedQuestIds: string[]) => NPC[];
  
  // Trade helpers
  getTradeableIngredients: (npcId: string) => string[];
  
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
    // Check world NPC roster first
    const worldNpc = world?.npcRoster.find(n => n.npcId === npcId);
    if (worldNpc) return worldNpc;
    
    // Check portal board NPCs
    return get().getPortalNPC(npcId);
  },
  
  getPortalNPC: (npcId) => {
    const { world } = get();
    if (!world?.portalBoards) return undefined;
    
    for (const portalBoard of world.portalBoards) {
      if (portalBoard.npc.npcId === npcId) {
        return portalBoard.npc;
      }
    }
    
    return undefined;
  },
  
  getQuestArc: (arcId) => {
    const { world } = get();
    return world?.questArcs.find(a => a.arcId === arcId);
  },
  
  getRegion: (regionId) => {
    const { world } = get();
    return world?.regions.find(r => r.regionId === regionId);
  },
  
  // Get quests available from an NPC (not active or completed, with prerequisites met)
  getAvailableQuestsForNPC: (npcId, activeQuestIds, completedQuestIds) => {
    const { world } = get();
    if (!world) return [];
    
    const availableQuests: QuestChapter[] = [];
    
    for (const arc of world.questArcs) {
      // Find NPCs involved in this arc
      const npc = world.npcRoster.find(n => n.npcId === npcId);
      if (!npc) continue;
      
      // Check if NPC is linked to this quest arc
      const npcInArc = npc.questHooks.includes(arc.arcId) || 
        arc.chapters.some(ch => ch.giverNpcId === npcId);
      
      if (!npcInArc) continue;
      
      for (const chapter of arc.chapters) {
        // Skip if not this NPC's quest to give
        if (chapter.giverNpcId !== npcId) continue;
        
        // Skip if already active or completed
        if (activeQuestIds.includes(chapter.questId)) continue;
        if (completedQuestIds.includes(chapter.questId)) continue;
        
        // Check prerequisites (previous quest in chain must be completed)
        const prevChapterIndex = arc.chapters.findIndex(c => c.nextQuestId === chapter.questId);
        if (prevChapterIndex >= 0) {
          const prevChapter = arc.chapters[prevChapterIndex];
          if (!completedQuestIds.includes(prevChapter.questId)) continue;
        }
        
        // This is the first quest in the arc if no previous chapter references it
        // OR the previous quest is completed
        availableQuests.push(chapter);
      }
    }
    
    return availableQuests;
  },
  
  // Get a specific quest chapter by ID
  getQuestChapter: (questId) => {
    const { world } = get();
    if (!world) return undefined;
    
    for (const arc of world.questArcs) {
      const chapter = arc.chapters.find(c => c.questId === questId);
      if (chapter) return chapter;
    }
    return undefined;
  },
  
  // Get all NPCs who can give quests (have available quests)
  getNPCsWhoCanGiveQuests: (activeQuestIds, completedQuestIds) => {
    const { world, getAvailableQuestsForNPC } = get();
    if (!world) return [];
    
    return world.npcRoster.filter(npc => 
      getAvailableQuestsForNPC(npc.npcId, activeQuestIds, completedQuestIds).length > 0
    );
  },
  
  // Get tradeable ingredients for an NPC based on their services
  getTradeableIngredients: (npcId) => {
    const { world } = get();
    if (!world) return [];
    
    const npc = world.npcRoster.find(n => n.npcId === npcId);
    if (!npc) return [];
    
    // Check if NPC offers trading services
    const canTrade = npc.role.services.some(s => 
      s.toLowerCase().includes('trade') || 
      s.toLowerCase().includes('sell') ||
      s.toLowerCase().includes('shop')
    );
    
    if (!canTrade) return [];
    
    // Find ingredients in the current region that can be traded
    const currentRegion = get().currentRegion;
    if (!currentRegion) return [];
    
    return world.ingredientGraph.ingredients
      .filter(i => 
        i.gatherMethod === 'trade' && 
        i.regionId === currentRegion.regionId
      )
      .map(i => i.ingredientId);
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

