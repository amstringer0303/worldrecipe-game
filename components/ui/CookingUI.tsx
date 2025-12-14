'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useWorldStore } from '@/lib/store/worldStore';

// ============================================
// Mini-Game: Stir
// ============================================

function StirMiniGame({ onComplete }: { onComplete: (success: boolean) => void }) {
  const [progress, setProgress] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [rhythm, setRhythm] = useState<'good' | 'fast' | 'slow' | null>(null);
  
  const TARGET_INTERVAL = 500; // ms between clicks
  const TOLERANCE = 200;
  
  const handleClick = () => {
    const now = Date.now();
    
    if (lastClickTime > 0) {
      const interval = now - lastClickTime;
      
      if (Math.abs(interval - TARGET_INTERVAL) < TOLERANCE) {
        setRhythm('good');
        setProgress((p) => Math.min(100, p + 12));
      } else if (interval < TARGET_INTERVAL - TOLERANCE) {
        setRhythm('fast');
        setProgress((p) => Math.max(0, p - 5));
      } else {
        setRhythm('slow');
        setProgress((p) => Math.max(0, p - 5));
      }
    }
    
    setLastClickTime(now);
    
    setTimeout(() => setRhythm(null), 200);
  };
  
  useEffect(() => {
    if (progress >= 100) {
      onComplete(true);
    }
  }, [progress, onComplete]);
  
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-muted-foreground">Click rhythmically to stir!</p>
      
      <div className="relative w-32 h-32 mx-auto">
        <Button
          onClick={handleClick}
          className={`w-full h-full rounded-full text-4xl transition-all ${
            rhythm === 'good' ? 'scale-110 bg-green-500' :
            rhythm === 'fast' ? 'bg-red-500' :
            rhythm === 'slow' ? 'bg-yellow-500' : ''
          }`}
        >
          🥄
        </Button>
        {rhythm && (
          <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold ${
            rhythm === 'good' ? 'text-green-500' : 'text-yellow-500'
          }`}>
            {rhythm === 'good' ? 'Perfect!' : rhythm === 'fast' ? 'Too fast!' : 'Too slow!'}
          </span>
        )}
      </div>
      
      <Progress value={progress} className="h-3" />
      <p className="text-xs text-muted-foreground">
        Match the rhythm: ~2 clicks per second
      </p>
    </div>
  );
}

// ============================================
// Mini-Game: Chop
// ============================================

function ChopMiniGame({ onComplete }: { onComplete: (success: boolean) => void }) {
  const [targets, setTargets] = useState<{ id: number; position: number; hit: boolean }[]>([]);
  const [nextId, setNextId] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  
  const REQUIRED_HITS = 8;
  const MAX_MISSES = 3;
  
  // Spawn targets
  useEffect(() => {
    const interval = setInterval(() => {
      setTargets((prev) => [
        ...prev.filter((t) => !t.hit && t.position > -10),
        { id: nextId, position: 100, hit: false },
      ]);
      setNextId((n) => n + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nextId]);
  
  // Move targets
  useEffect(() => {
    const interval = setInterval(() => {
      setTargets((prev) => {
        const updated = prev.map((t) => ({ ...t, position: t.position - 5 }));
        const missed = updated.filter((t) => !t.hit && t.position < 0);
        if (missed.length > 0) {
          setMisses((m) => m + missed.length);
        }
        return updated.filter((t) => t.position > -10);
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Check win/lose
  useEffect(() => {
    if (score >= REQUIRED_HITS) {
      onComplete(true);
    } else if (misses >= MAX_MISSES) {
      onComplete(false);
    }
  }, [score, misses, onComplete]);
  
  const handleChop = () => {
    setTargets((prev) => {
      const hitZone = prev.find((t) => !t.hit && t.position >= 40 && t.position <= 60);
      if (hitZone) {
        setScore((s) => s + 1);
        return prev.map((t) => (t.id === hitZone.id ? { ...t, hit: true } : t));
      }
      return prev;
    });
  };
  
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-muted-foreground">Hit the ingredients as they pass the center!</p>
      
      <div className="flex justify-between text-sm">
        <span className="text-green-500">Hits: {score}/{REQUIRED_HITS}</span>
        <span className="text-red-500">Misses: {misses}/{MAX_MISSES}</span>
      </div>
      
      <div className="relative h-20 bg-muted/30 rounded-lg overflow-hidden">
        {/* Center zone indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-10 bg-green-500/20 border-x-2 border-green-500" />
        
        {/* Targets */}
        {targets.map((target) => (
          <div
            key={target.id}
            className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-2xl transition-all ${
              target.hit ? 'scale-0 opacity-0' : ''
            }`}
            style={{ left: `${target.position}%`, transform: `translateX(-50%) translateY(-50%)` }}
          >
            🥕
          </div>
        ))}
      </div>
      
      <Button onClick={handleChop} size="lg" className="w-full h-16 text-2xl">
        🔪 CHOP!
      </Button>
    </div>
  );
}

// ============================================
// Mini-Game: Toast
// ============================================

function ToastMiniGame({ onComplete }: { onComplete: (success: boolean) => void }) {
  const [heat, setHeat] = useState(0);
  const [isHeating, setIsHeating] = useState(false);
  const [result, setResult] = useState<'raw' | 'perfect' | 'burnt' | null>(null);
  
  const PERFECT_MIN = 60;
  const PERFECT_MAX = 80;
  
  useEffect(() => {
    if (!isHeating) return;
    
    const interval = setInterval(() => {
      setHeat((h) => {
        const newHeat = Math.min(100, h + 2);
        if (newHeat >= 100) {
          setIsHeating(false);
          setResult('burnt');
          onComplete(false);
        }
        return newHeat;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [isHeating, onComplete]);
  
  const handleRelease = () => {
    setIsHeating(false);
    
    if (heat >= PERFECT_MIN && heat <= PERFECT_MAX) {
      setResult('perfect');
      onComplete(true);
    } else if (heat < PERFECT_MIN) {
      setResult('raw');
      // Allow retry
      setTimeout(() => setResult(null), 1000);
    } else {
      setResult('burnt');
      onComplete(false);
    }
  };
  
  const getHeatColor = () => {
    if (heat < PERFECT_MIN) return 'bg-yellow-500';
    if (heat <= PERFECT_MAX) return 'bg-green-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-muted-foreground">Hold to heat, release in the green zone!</p>
      
      {/* Heat meter */}
      <div className="relative h-8 bg-muted/30 rounded-full overflow-hidden">
        {/* Zone indicators */}
        <div 
          className="absolute top-0 bottom-0 bg-green-500/30" 
          style={{ left: `${PERFECT_MIN}%`, width: `${PERFECT_MAX - PERFECT_MIN}%` }} 
        />
        
        {/* Heat progress */}
        <div 
          className={`absolute top-0 bottom-0 left-0 transition-all ${getHeatColor()}`}
          style={{ width: `${heat}%` }}
        />
        
        {/* Labels */}
        <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-bold">
          <span>RAW</span>
          <span className="text-green-500">PERFECT</span>
          <span className="text-red-500">BURNT</span>
        </div>
      </div>
      
      <Button
        size="lg"
        className={`w-full h-20 text-2xl ${isHeating ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
        onMouseDown={() => setIsHeating(true)}
        onMouseUp={handleRelease}
        onMouseLeave={() => isHeating && handleRelease()}
        onTouchStart={() => setIsHeating(true)}
        onTouchEnd={handleRelease}
      >
        {isHeating ? '🔥 TOASTING...' : '👆 HOLD TO TOAST'}
      </Button>
      
      {result && (
        <Badge variant={result === 'perfect' ? 'default' : 'destructive'} className="text-lg py-2 px-4">
          {result === 'perfect' && '✨ Perfect Toast!'}
          {result === 'raw' && '🥶 Too raw, try again!'}
          {result === 'burnt' && '💨 Burnt!'}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// Cooking Step Card
// ============================================

interface CookingStepProps {
  step: {
    stepId: string;
    name: string;
    description: string;
    technique: string;
    unlocked: boolean;
    completed: boolean;
    miniGameType?: 'stir' | 'chop' | 'toast';
    requiredIngredients: { ingredientId: string; quantity: number }[];
  };
  index: number;
  onStartCooking: (stepId: string) => void;
}

function CookingStepCard({ step, index, onStartCooking }: CookingStepProps) {
  const inventory = usePlayerStore((s) => s.inventory);
  const world = useWorldStore((s) => s.world);
  
  const hasIngredients = step.requiredIngredients.every((req) => {
    const owned = inventory.find((i) => i.item.itemId === req.ingredientId);
    return owned && owned.quantity >= req.quantity;
  });
  
  const canCook = step.unlocked && !step.completed && hasIngredients;
  
  return (
    <Card className={`${step.completed ? 'bg-green-500/10 border-green-500/30' : step.unlocked ? 'bg-muted/30' : 'bg-muted/10 opacity-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
            step.completed ? 'bg-green-500 text-white' : 
            step.unlocked ? 'bg-primary/20' : 'bg-muted'
          }`}>
            {step.completed ? '✓' : index + 1}
          </span>
          
          <div className="flex-1">
            <h4 className="font-semibold">{step.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            
            {/* Required ingredients */}
            <div className="flex flex-wrap gap-2 mt-2">
              {step.requiredIngredients.map((req) => {
                const ing = world?.ingredientGraph.ingredients.find((i) => i.ingredientId === req.ingredientId);
                const owned = inventory.find((i) => i.item.itemId === req.ingredientId);
                const hasEnough = owned && owned.quantity >= req.quantity;
                
                return (
                  <Badge
                    key={req.ingredientId}
                    variant={hasEnough ? 'default' : 'secondary'}
                    className={!hasEnough ? 'opacity-50' : ''}
                  >
                    {ing?.name || req.ingredientId} x{req.quantity}
                    {hasEnough && ' ✓'}
                  </Badge>
                );
              })}
            </div>
            
            {step.unlocked && !step.completed && (
              <Button
                className="mt-3"
                size="sm"
                disabled={!canCook}
                onClick={() => onStartCooking(step.stepId)}
              >
                {canCook ? '🍳 Start Cooking' : '🔒 Missing Ingredients'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Cooking UI
// ============================================

export function CookingUI() {
  const showCooking = useGameStore((s) => s.showCooking);
  const toggleCooking = useGameStore((s) => s.toggleCooking);
  const world = useWorldStore((s) => s.world);
  const completedSteps = usePlayerStore((s) => s.completedCookingSteps);
  const completeCookingStep = usePlayerStore((s) => s.completeCookingStep);
  
  const [activeMiniGame, setActiveMiniGame] = useState<{
    stepId: string;
    type: 'stir' | 'chop' | 'toast';
  } | null>(null);
  
  if (!showCooking) return null;
  
  // Mock cooking steps based on quest arcs
  const cookingSteps = world?.questArcs.map((arc, index) => ({
    stepId: arc.unlocksCookingStepId || `step_${index}`,
    name: arc.title,
    description: `Complete "${arc.title}" to unlock this cooking step`,
    technique: 'Basic',
    unlocked: arc.chapters.every((ch) => completedSteps.includes(ch.questId)),
    completed: completedSteps.includes(arc.unlocksCookingStepId || `step_${index}`),
    miniGameType: (['stir', 'chop', 'toast'] as const)[index % 3],
    requiredIngredients: [],
  })) || [];
  
  const handleStartCooking = (stepId: string) => {
    const step = cookingSteps.find((s) => s.stepId === stepId);
    if (step?.miniGameType) {
      setActiveMiniGame({ stepId, type: step.miniGameType });
    }
  };
  
  const handleMiniGameComplete = (success: boolean) => {
    if (success && activeMiniGame) {
      completeCookingStep(activeMiniGame.stepId);
    }
    setActiveMiniGame(null);
  };
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-card/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <span>🍳</span>
            Cooking Station
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleCooking}>
            ✕
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-auto max-h-[calc(80vh-80px)]">
          {activeMiniGame ? (
            <div className="py-8">
              <h3 className="text-center font-bold text-lg mb-6">
                {activeMiniGame.type === 'stir' && '🥄 Stirring Time!'}
                {activeMiniGame.type === 'chop' && '🔪 Chopping Challenge!'}
                {activeMiniGame.type === 'toast' && '🔥 Toasting Task!'}
              </h3>
              
              {activeMiniGame.type === 'stir' && (
                <StirMiniGame onComplete={handleMiniGameComplete} />
              )}
              {activeMiniGame.type === 'chop' && (
                <ChopMiniGame onComplete={handleMiniGameComplete} />
              )}
              {activeMiniGame.type === 'toast' && (
                <ToastMiniGame onComplete={handleMiniGameComplete} />
              )}
              
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => setActiveMiniGame(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dish overview */}
              {world && (
                <Card className="bg-primary/10 border-primary/30">
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className="text-5xl">🍜</span>
                    <div>
                      <h3 className="font-bold text-xl">{world.dish.name}</h3>
                      <p className="text-sm text-muted-foreground">{world.dish.tagline}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Cooking steps */}
              <div className="space-y-3">
                {cookingSteps.map((step, index) => (
                  <CookingStepCard
                    key={step.stepId}
                    step={step}
                    index={index}
                    onStartCooking={handleStartCooking}
                  />
                ))}
              </div>
              
              {cookingSteps.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>No cooking steps available yet.</p>
                  <p className="text-sm">Complete quests to unlock recipes!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CookingUI;

