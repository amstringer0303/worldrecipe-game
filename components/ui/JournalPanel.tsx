'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useWorldStore } from '@/lib/store/worldStore';

// ============================================
// Recipe Progress Tab
// ============================================

function RecipeProgressTab() {
  const world = useWorldStore((s) => s.world);
  const completedSteps = usePlayerStore((s) => s.completedCookingSteps);
  
  if (!world) {
    return <div className="text-muted-foreground p-4">No world loaded</div>;
  }
  
  // Extract cooking steps from quest arcs
  const cookingSteps = world.questArcs
    .filter(arc => arc.unlocksCookingStepId)
    .map(arc => ({
      stepId: arc.unlocksCookingStepId!,
      name: arc.title,
      unlocked: completedSteps.includes(arc.unlocksCookingStepId!),
      questsRequired: arc.chapters.length,
    }));
  
  const completedCount = cookingSteps.filter(s => s.unlocked).length;
  const progress = cookingSteps.length > 0 
    ? (completedCount / cookingSteps.length) * 100 
    : 0;
  
  return (
    <div className="space-y-4">
      {/* Main dish info */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🍜</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{world.dish.name}</h3>
              <p className="text-sm text-muted-foreground">{world.dish.tagline}</p>
            </div>
            <Badge variant={world.dish.difficulty === 'easy' ? 'secondary' : 'default'}>
              {world.dish.difficulty}
            </Badge>
          </div>
          <Progress value={progress} className="mt-4 h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedCount} of {cookingSteps.length} steps completed
          </p>
        </CardContent>
      </Card>
      
      {/* Steps list */}
      <div className="space-y-2">
        {cookingSteps.map((step, index) => (
          <Card 
            key={step.stepId}
            className={`${step.unlocked ? 'bg-primary/10 border-primary/30' : 'bg-muted/20'}`}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                {step.unlocked ? '✓' : index + 1}
              </span>
              <div className="flex-1">
                <p className={`font-medium ${step.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.questsRequired} quest{step.questsRequired > 1 ? 's' : ''} required
                </p>
              </div>
              {step.unlocked && <span className="text-green-500">🍳</span>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Ingredients Tab
// ============================================

function IngredientsTab() {
  const world = useWorldStore((s) => s.world);
  const inventory = usePlayerStore((s) => s.inventory);
  
  if (!world) {
    return <div className="text-muted-foreground p-4">No world loaded</div>;
  }
  
  const { ingredients } = world.ingredientGraph;
  
  // Check which ingredients player has
  const ingredientStatus = ingredients.map(ing => {
    const owned = inventory.find(i => i.item.itemId === ing.ingredientId);
    return {
      ...ing,
      owned: !!owned,
      quantity: owned?.quantity || 0,
    };
  });
  
  const collectedCount = ingredientStatus.filter(i => i.owned).length;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Collected: {collectedCount}/{ingredients.length}
        </span>
        <Progress value={(collectedCount / ingredients.length) * 100} className="w-32 h-2" />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {ingredientStatus.map((ing) => (
          <Card 
            key={ing.ingredientId}
            className={`${ing.owned ? 'bg-primary/10' : 'bg-muted/20 opacity-60'}`}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {ing.category === 'vegetable' && '🥬'}
                  {ing.category === 'protein' && '🥩'}
                  {ing.category === 'grain' && '🌾'}
                  {ing.category === 'spice' && '🌶️'}
                  {ing.category === 'liquid' && '💧'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ing.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ing.gatherMethod}
                  </p>
                </div>
                {ing.owned && (
                  <Badge variant="secondary" className="text-xs">
                    x{ing.quantity}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Relationships Tab
// ============================================

function RelationshipsTab() {
  const world = useWorldStore((s) => s.world);
  const relationships = usePlayerStore((s) => s.npcRelationships);
  
  if (!world) {
    return <div className="text-muted-foreground p-4">No world loaded</div>;
  }
  
  return (
    <div className="space-y-3">
      {world.npcRoster.map((npc) => {
        const level = relationships[npc.npcId] || 0;
        const maxLevel = npc.relationship.maxLevel;
        const progress = (level / maxLevel) * 100;
        
        return (
          <Card key={npc.npcId} className="bg-muted/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {npc.role.job.includes('Chef') && '👨‍🍳'}
                  {npc.role.job === 'Fisherman' && '🎣'}
                  {npc.role.job === 'Farmer' && '👨‍🌾'}
                  {npc.role.job === 'Merchant' && '🏪'}
                  {!['Chef', 'Fisherman', 'Farmer', 'Merchant'].some(r => npc.role.job.includes(r)) && '👤'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{npc.name}</p>
                    <span className="text-xs text-muted-foreground">
                      ❤️ {level}/{maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{npc.role.job}</p>
                  <Progress value={progress} className="h-1 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================
// Quests Tab
// ============================================

function QuestsTab() {
  const activeQuests = usePlayerStore((s) => s.activeQuests);
  const completedQuestIds = usePlayerStore((s) => s.completedQuestIds);
  const world = useWorldStore((s) => s.world);
  
  return (
    <div className="space-y-4">
      {/* Active Quests */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Active Quests</h4>
        {activeQuests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active quests. Talk to NPCs to find work!</p>
        ) : (
          <div className="space-y-2">
            {activeQuests.map((quest) => (
              <Card key={quest.questId} className="bg-primary/10 border-primary/30">
                <CardContent className="p-3">
                  <h5 className="font-medium">{quest.title}</h5>
                  <p className="text-xs text-muted-foreground mt-1">{quest.description}</p>
                  <div className="mt-2 space-y-1">
                    {quest.objectives.map((obj) => (
                      <div 
                        key={obj.objectiveId}
                        className={`text-xs flex items-center gap-2 ${
                          obj.completed ? 'text-green-500 line-through' : 'text-foreground'
                        }`}
                      >
                        <span>{obj.completed ? '✓' : '○'}</span>
                        <span>{obj.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Completed Quests */}
      {completedQuestIds.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Completed ({completedQuestIds.length})
          </h4>
          <div className="text-xs text-muted-foreground">
            {completedQuestIds.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Journal Panel
// ============================================

export function JournalPanel() {
  const showJournal = useGameStore((s) => s.showJournal);
  const toggleJournal = useGameStore((s) => s.toggleJournal);
  
  if (!showJournal) return null;
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-card/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <span>📔</span>
            Journal
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleJournal}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[calc(80vh-80px)]">
          <Tabs defaultValue="recipe">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recipe">Recipe</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="quests">Quests</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
            </TabsList>
            <TabsContent value="recipe" className="mt-4">
              <RecipeProgressTab />
            </TabsContent>
            <TabsContent value="ingredients" className="mt-4">
              <IngredientsTab />
            </TabsContent>
            <TabsContent value="quests" className="mt-4">
              <QuestsTab />
            </TabsContent>
            <TabsContent value="friends" className="mt-4">
              <RelationshipsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default JournalPanel;

