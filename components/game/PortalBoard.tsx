'use client';

import { Suspense, useCallback } from 'react';
import { VoxelTerrain } from './VoxelTerrain';
import { NPCManager } from './NPCController';
import { InteractableManager } from './Interactable';
import { usePortalStore } from '@/lib/store/portalStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useWorldStore } from '@/lib/store/worldStore';
import { useGameStore } from '@/lib/store/gameStore';

// ============================================
// Portal Board Component
// ============================================

interface PortalBoardProps {
  onNPCInteract?: (npcId: string) => void;
  onIngredientPickup?: (ingredientId: string) => void;
}

export function PortalBoard({ onNPCInteract, onIngredientPickup }: PortalBoardProps) {
  const portalBoard = usePortalStore((s) => s.getCurrentPortalBoard());
  const collectedItemIds = usePlayerStore((s) => s.collectedItemIds);
  const world = useWorldStore((s) => s.world);
  const startDialogue = useGameStore((s) => s.startDialogue);
  const addItem = usePlayerStore((s) => s.addItem);
  const checkAndUpdateTalkObjectives = usePlayerStore((s) => s.checkAndUpdateTalkObjectives);
  
  const handleNPCInteract = useCallback((npcId: string) => {
    if (onNPCInteract) {
      onNPCInteract(npcId);
      return;
    }
    
    // Default handler
    const npc = portalBoard?.npc;
    if (npc && npc.npcId === npcId) {
      checkAndUpdateTalkObjectives(npcId);
      startDialogue(npcId, {
        nodeId: 'start',
        speaker: npc.name,
        text: '',
        choices: [],
      });
    }
  }, [portalBoard, onNPCInteract, startDialogue, checkAndUpdateTalkObjectives]);
  
  const handleIngredientPickup = useCallback((ingredientId: string) => {
    if (onIngredientPickup) {
      onIngredientPickup(ingredientId);
      return;
    }
    
    // Default handler
    const ingredient = portalBoard?.ingredients.find(i => i.ingredientId === ingredientId);
    if (ingredient) {
      addItem({
        itemId: ingredientId,
        name: ingredient.name,
        description: `A ${ingredient.category} from ${portalBoard?.name}`,
        category: 'ingredient',
        rarity: 'common',
      });
    }
  }, [portalBoard, onIngredientPickup, addItem]);
  
  if (!portalBoard || !world) {
    return null;
  }
  
  const { mapSpec, npc, ingredients, palette } = portalBoard;
  const mapWidth = mapSpec.grid.width;
  const mapHeight = mapSpec.grid.height;
  
  // Create a mini-region spec for VoxelTerrain
  const miniRegion = {
    regionId: portalBoard.boardId,
    name: portalBoard.name,
    inspiration: {
      countryOrArea: portalBoard.description,
      notes: '',
      avoidStereotypesChecklist: [],
    },
    biomes: [portalBoard.portalType],
    palette,
    mapSpec,
    pois: mapSpec.pois || [],
    spawnPoints: mapSpec.spawnPoints,
    decorRules: mapSpec.decorRules,
  };
  
  return (
    <Suspense fallback={null}>
      {/* Ground */}
      <VoxelTerrain region={miniRegion} seed={world.seed} />
      
      {/* NPC */}
      <NPCManager 
        npcs={[npc]} 
        pois={mapSpec.pois || []}
        onNPCInteract={handleNPCInteract}
      />
      
      {/* Ingredients */}
      <InteractableManager
        ingredients={ingredients}
        regionId={portalBoard.boardId}
        seed={world.seed}
        onIngredientPickup={handleIngredientPickup}
        collectedItemIds={collectedItemIds}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
      />
    </Suspense>
  );
}

