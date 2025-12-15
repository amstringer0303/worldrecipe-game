// ============================================
// World Recipe - Core Game Types
// ============================================

// Time of day cycle
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

// Player state
export interface PlayerState {
  position: [number, number, number];
  rotation: number;
  velocity: [number, number, number];
}

// Item and inventory
export interface Item {
  itemId: string;
  name: string;
  description: string;
  category: 'ingredient' | 'tool' | 'souvenir' | 'clothing' | 'decor';
  icon?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface ItemStack {
  item: Item;
  quantity: number;
}

// Ingredient system
export interface Ingredient extends Item {
  category: 'ingredient';
  origin: string; // Region where found
  seasonality?: string[];
  substitutes?: string[]; // IDs of substitute ingredients
  flavorProfile?: string[];
}

// NPC system
export interface NPCPersonality {
  archetype: string;
  traits: string[];
  speakingStyle: string;
  likes: string[];
  dislikes: string[];
}

export interface NPCVisual {
  paletteOverrides?: Record<string, string>;
  outfitTags: string[];
  accessoryTags: string[];
}

export interface ScheduleEntry {
  timeOfDay: TimeOfDay;
  locationId: string;
  activity: string;
}

export interface NPC {
  npcId: string;
  name: string;
  speciesStyle: string;
  personality: NPCPersonality;
  role: {
    job: string;
    services: string[];
  };
  schedule: ScheduleEntry[];
  relationship: {
    startingLevel: number;
    maxLevel: number;
    levelRewards: string[];
  };
  questHooks: string[];
  visual: NPCVisual;
}

// Dialogue system
export interface DialogueChoice {
  text: string;
  nextNodeId?: string;
  effect?: {
    type: 'relationship' | 'quest' | 'trade' | 'hint';
    value: string | number;
  };
}

export interface DialogueNode {
  nodeId: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  tags?: string[];
}

export interface DialoguePack {
  greeting: DialogueNode[];
  questOffer: DialogueNode[];
  questProgress: DialogueNode[];
  relationshipEvents: DialogueNode[];
  general: DialogueNode[];
}

// Quest system
export type ObjectiveType = 'gather' | 'deliver' | 'talk' | 'craft' | 'cook-step';

export interface QuestObjective {
  objectiveId: string;
  type: ObjectiveType;
  description: string;
  target: string; // Item ID, NPC ID, or step ID
  quantity?: number;
  completed: boolean;
}

export interface QuestChapter {
  questId: string;
  title: string;
  description: string;
  giverNpcId: string;
  objectives: QuestObjective[];
  rewards: ItemStack[];
  nextQuestId?: string;
}

export interface QuestArc {
  arcId: string;
  title: string;
  chapters: QuestChapter[];
  unlocksCookingStepId?: string;
}

// Cooking system
export interface CookingStep {
  stepId: string;
  name: string;
  description: string;
  technique: string;
  requiredIngredients: { ingredientId: string; quantity: number; substitutes?: string[] }[];
  miniGameType?: 'stir' | 'chop' | 'toast' | 'none';
  unlocked: boolean;
  completed: boolean;
}

export interface Dish {
  name: string;
  tagline: string;
  inspirations: string[];
  dietaryTags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  storyHook: string;
}

// Position types - support both tuple and object formats
export type PositionTuple = [number, number];
export type PositionObject = { x: number; y: number };
export type Position = PositionTuple | PositionObject;

// Helper to normalize position to tuple format
export function normalizePosition(pos: Position): [number, number] {
  if (Array.isArray(pos)) {
    return pos;
  }
  return [pos.x, pos.y];
}

// Portal types
export type PortalType = 'farm' | 'grocery_store' | 'kitchen' | 'foraging_grounds' | 'exotic_garden';

// Map and region
export interface POI {
  poiId: string;
  type: 'market' | 'dock' | 'shrine' | 'farm' | 'kitchen_hut' | 'npc_home' | 'gathering_spot' | 'portal';
  name: string;
  position: Position;
  interactRadius: number;
  // Portal-specific fields
  portalType?: PortalType;
  destinationBoardId?: string; // ID of the portal board
  requiredIngredients?: string[]; // For kitchen portal
  isReturnPortal?: boolean; // True if this is a return portal in a portal board
}

export type Size = [number, number] | { width: number; height: number };

// Helper to normalize size to tuple format
export function normalizeSize(size: Size): [number, number] {
  if (Array.isArray(size)) {
    return size;
  }
  return [size.width, size.height];
}

export interface DecorRules {
  density: number;
  propThemes: string[];
}

export interface SpawnPoints {
  player: Position;
  npcSpawns: { npcId: string; position: Position }[];
}

export interface MapSpec {
  grid: {
    width: number;
    height: number;
    cellSize: number;
  };
  terrain: {
    waterBodies: { position: Position; size: Size }[];
    elevationHints: { position: Position; height: number }[];
    paths: { from: Position; to: Position }[];
  };
  // These can be optional at mapSpec level if defined at region level
  pois?: POI[];
  spawnPoints?: SpawnPoints;
  decorRules?: DecorRules;
}

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  ground: string;
  foliage: string;
  sky: string;
  uiBg: string;
  uiText: string;
}

export interface RegionInspiration {
  countryOrArea: string;
  notes: string;
  avoidStereotypesChecklist: string[];
}

export interface RegionSpec {
  regionId: string;
  name: string;
  inspiration: RegionInspiration;
  biomes: string[];
  palette: Palette;
  mapSpec: MapSpec;
  // These can be at region level (AI sometimes generates them here)
  pois?: POI[];
  spawnPoints?: SpawnPoints;
  decorRules?: DecorRules;
}

// Ingredient graph
export interface IngredientNode {
  ingredientId: string;
  name: string;
  category: string;
  regionId: string;
  gatherMethod: 'pickup' | 'harvest' | 'fish' | 'trade' | 'craft' | 'gather' | 'forage';
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'requires' | 'unlocks' | 'substitute';
}

export interface IngredientGraph {
  ingredients: IngredientNode[];
  dependencies: DependencyEdge[];
}

// Portal Board - mini-board accessible via portal
export interface PortalBoard {
  boardId: string;
  portalType: PortalType;
  name: string;
  description: string;
  mapSpec: MapSpec; // Small board (~40x40)
  npc: NPC; // Single NPC for this board
  ingredients: IngredientNode[]; // Ingredients available here
  spawnPoint: Position;
  palette: Palette;
}

// World Recipe - main generated object
export interface WorldRecipe {
  worldId: string;
  seed: string;
  dish: Dish;
  regions: RegionSpec[];
  ingredientGraph: IngredientGraph;
  questArcs: QuestArc[];
  npcRoster: NPC[];
  portalBoards?: PortalBoard[]; // Portal boards accessible from hub
  colorSystem: {
    uiTokens: Record<string, string>;
    environmentTokens: Record<string, string>;
  };
  startingInventory: ItemStack[];
}

// Game save state
export interface GameSave {
  saveId: string;
  worldId: string;
  playerPosition: [number, number, number];
  currentRegionId: string;
  inventory: ItemStack[];
  completedQuests: string[];
  activeQuests: QuestChapter[];
  npcRelationships: Record<string, number>;
  completedCookingSteps: string[];
  timeOfDay: TimeOfDay;
  dayNumber: number;
  playTimeSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

// UI state types
export interface InteractionPrompt {
  visible: boolean;
  text: string;
  targetId?: string;
  targetType?: 'npc' | 'item' | 'poi';
}

export interface DialogueState {
  active: boolean;
  currentNpcId?: string;
  currentNode?: DialogueNode;
  history: DialogueNode[];
}

