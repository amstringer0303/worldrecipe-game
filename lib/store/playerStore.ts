import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ItemStack, Item, QuestChapter, QuestObjective } from '@/types/game';

// ============================================
// Player Store - Player-specific state
// ============================================

interface PlayerState {
  // Position and movement
  position: [number, number, number];
  rotation: number;
  isMoving: boolean;
  moveDirection: { x: number; z: number };
  
  // Inventory
  inventory: ItemStack[];
  maxInventorySlots: number;
  
  // Quests
  activeQuests: QuestChapter[];
  completedQuestIds: string[];
  
  // NPC relationships
  npcRelationships: Record<string, number>;
  
  // Cooking progress
  completedCookingSteps: string[];
  unlockedTechniques: string[];
  
  // Stats
  stamina: number;
  maxStamina: number;
  
  // Actions
  setPosition: (pos: [number, number, number]) => void;
  setRotation: (rot: number) => void;
  setMoving: (moving: boolean) => void;
  setMoveDirection: (dir: { x: number; z: number }) => void;
  
  // Inventory actions
  addItem: (item: Item, quantity?: number) => boolean;
  removeItem: (itemId: string, quantity?: number) => boolean;
  hasItem: (itemId: string, quantity?: number) => boolean;
  getItemCount: (itemId: string) => number;
  
  // Quest actions
  acceptQuest: (quest: QuestChapter) => void;
  updateObjective: (questId: string, objectiveId: string) => void;
  completeQuest: (questId: string) => void;
  getActiveQuest: (questId: string) => QuestChapter | undefined;
  
  // Relationship actions
  updateRelationship: (npcId: string, delta: number) => void;
  getRelationship: (npcId: string) => number;
  
  // Cooking actions
  completeCookingStep: (stepId: string) => void;
  unlockTechnique: (techniqueId: string) => void;
  hasCompletedStep: (stepId: string) => boolean;
  
  // Stamina actions
  useStamina: (amount: number) => boolean;
  restoreStamina: (amount: number) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  position: [0, 0.5, 0] as [number, number, number],
  rotation: 0,
  isMoving: false,
  moveDirection: { x: 0, z: 0 },
  
  inventory: [] as ItemStack[],
  maxInventorySlots: 24,
  
  activeQuests: [] as QuestChapter[],
  completedQuestIds: [] as string[],
  
  npcRelationships: {} as Record<string, number>,
  
  completedCookingSteps: [] as string[],
  unlockedTechniques: [] as string[],
  
  stamina: 100,
  maxStamina: 100,
};

export const usePlayerStore = create<PlayerState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    setPosition: (pos) => set({ position: pos }),
    setRotation: (rot) => set({ rotation: rot }),
    setMoving: (moving) => set({ isMoving: moving }),
    setMoveDirection: (dir) => set({ moveDirection: dir }),
    
    addItem: (item, quantity = 1) => {
      const { inventory, maxInventorySlots } = get();
      const existingStack = inventory.find(stack => stack.item.itemId === item.itemId);
      
      if (existingStack) {
        // Add to existing stack
        set({
          inventory: inventory.map(stack =>
            stack.item.itemId === item.itemId
              ? { ...stack, quantity: stack.quantity + quantity }
              : stack
          ),
        });
        return true;
      }
      
      // Create new stack if we have room
      if (inventory.length < maxInventorySlots) {
        set({
          inventory: [...inventory, { item, quantity }],
        });
        return true;
      }
      
      return false; // No room
    },
    
    removeItem: (itemId, quantity = 1) => {
      const { inventory } = get();
      const stackIndex = inventory.findIndex(stack => stack.item.itemId === itemId);
      
      if (stackIndex === -1) return false;
      
      const stack = inventory[stackIndex];
      if (stack.quantity < quantity) return false;
      
      if (stack.quantity === quantity) {
        // Remove entire stack
        set({
          inventory: inventory.filter((_, i) => i !== stackIndex),
        });
      } else {
        // Reduce quantity
        set({
          inventory: inventory.map((s, i) =>
            i === stackIndex ? { ...s, quantity: s.quantity - quantity } : s
          ),
        });
      }
      
      return true;
    },
    
    hasItem: (itemId, quantity = 1) => {
      return get().getItemCount(itemId) >= quantity;
    },
    
    getItemCount: (itemId) => {
      const stack = get().inventory.find(s => s.item.itemId === itemId);
      return stack?.quantity ?? 0;
    },
    
    acceptQuest: (quest) => {
      const { activeQuests, completedQuestIds } = get();
      
      // Don't accept if already active or completed
      if (activeQuests.some(q => q.questId === quest.questId)) return;
      if (completedQuestIds.includes(quest.questId)) return;
      
      set({
        activeQuests: [...activeQuests, quest],
      });
    },
    
    updateObjective: (questId, objectiveId) => {
      set((state) => ({
        activeQuests: state.activeQuests.map(quest => {
          if (quest.questId !== questId) return quest;
          
          return {
            ...quest,
            objectives: quest.objectives.map(obj =>
              obj.objectiveId === objectiveId
                ? { ...obj, completed: true }
                : obj
            ),
          };
        }),
      }));
    },
    
    completeQuest: (questId) => {
      const { activeQuests, completedQuestIds, inventory, maxInventorySlots } = get();
      const quest = activeQuests.find(q => q.questId === questId);
      
      if (!quest) return;
      
      // Add rewards to inventory
      const newInventory = [...inventory];
      for (const reward of quest.rewards) {
        const existingStack = newInventory.find(s => s.item.itemId === reward.item.itemId);
        if (existingStack) {
          existingStack.quantity += reward.quantity;
        } else if (newInventory.length < maxInventorySlots) {
          newInventory.push({ ...reward });
        }
      }
      
      set({
        activeQuests: activeQuests.filter(q => q.questId !== questId),
        completedQuestIds: [...completedQuestIds, questId],
        inventory: newInventory,
      });
    },
    
    getActiveQuest: (questId) => {
      return get().activeQuests.find(q => q.questId === questId);
    },
    
    updateRelationship: (npcId, delta) => {
      set((state) => ({
        npcRelationships: {
          ...state.npcRelationships,
          [npcId]: Math.max(0, Math.min(10, (state.npcRelationships[npcId] ?? 0) + delta)),
        },
      }));
    },
    
    getRelationship: (npcId) => {
      return get().npcRelationships[npcId] ?? 0;
    },
    
    completeCookingStep: (stepId) => {
      const { completedCookingSteps } = get();
      if (!completedCookingSteps.includes(stepId)) {
        set({
          completedCookingSteps: [...completedCookingSteps, stepId],
        });
      }
    },
    
    unlockTechnique: (techniqueId) => {
      const { unlockedTechniques } = get();
      if (!unlockedTechniques.includes(techniqueId)) {
        set({
          unlockedTechniques: [...unlockedTechniques, techniqueId],
        });
      }
    },
    
    hasCompletedStep: (stepId) => {
      return get().completedCookingSteps.includes(stepId);
    },
    
    useStamina: (amount) => {
      const { stamina } = get();
      if (stamina < amount) return false;
      set({ stamina: stamina - amount });
      return true;
    },
    
    restoreStamina: (amount) => {
      const { stamina, maxStamina } = get();
      set({ stamina: Math.min(maxStamina, stamina + amount) });
    },
    
    reset: () => set(initialState),
  }))
);

