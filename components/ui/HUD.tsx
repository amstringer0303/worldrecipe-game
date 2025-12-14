'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useWorldStore } from '@/lib/store/worldStore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================
// Animated Number Display
// ============================================
function AnimatedNumber({ value, duration = 500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const startValue = displayValue;
    const diff = value - startValue;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return <>{displayValue}</>;
}

// ============================================
// Time Display Component - Enhanced
// ============================================
function TimeDisplay() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const dayNumber = useGameStore((s) => s.dayNumber);
  
  const timeConfig = {
    morning: { icon: '🌅', label: 'Morning', gradient: 'from-amber-400 to-orange-300' },
    day: { icon: '☀️', label: 'Daytime', gradient: 'from-sky-400 to-blue-300' },
    evening: { icon: '🌆', label: 'Evening', gradient: 'from-orange-500 to-red-400' },
    night: { icon: '🌙', label: 'Night', gradient: 'from-indigo-600 to-purple-500' },
  };
  
  const config = timeConfig[timeOfDay];
  
  return (
    <Card className={`hud-card px-4 py-2.5 bg-gradient-to-r ${config.gradient} border-0 shadow-lg`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-pulse-slow drop-shadow-lg">{config.icon}</span>
        <div>
          <p className="text-sm font-bold text-white drop-shadow-sm">{config.label}</p>
          <p className="text-xs text-white/80 font-medium">Day {dayNumber}</p>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Region Display
// ============================================
function RegionDisplay() {
  const region = useWorldStore((s) => s.currentRegion);
  const world = useWorldStore((s) => s.world);
  
  if (!region || !world) return null;
  
  return (
    <Card className="hud-card px-4 py-2 bg-card/95 backdrop-blur-md border-primary/20 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">🗺️</span>
        <div>
          <p className="text-xs font-bold text-foreground">{region.name}</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
            {region.inspiration.countryOrArea}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Enhanced Mini Map Component
// ============================================
function MiniMap() {
  const position = usePlayerStore((s) => s.position);
  const rotation = usePlayerStore((s) => s.rotation);
  const region = useWorldStore((s) => s.currentRegion);
  
  const pois = region?.mapSpec.pois || [];
  const mapSize = 50; // Assume 50x50 map
  
  return (
    <Card className="hud-card w-36 h-36 bg-card/95 backdrop-blur-md border-primary/20 overflow-hidden shadow-xl">
      <div className="relative w-full h-full">
        {/* Map background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-emerald-800/60" />
        
        {/* Grid lines */}
        <div className="absolute inset-1 grid grid-cols-6 grid-rows-6">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border border-emerald-600/20" />
          ))}
        </div>
        
        {/* POI indicators */}
        {pois.slice(0, 8).map((poi, i) => {
          const x = 50 + (poi.position[0] / mapSize) * 40;
          const y = 50 + (poi.position[1] / mapSize) * 40;
          
          const poiColors: Record<string, string> = {
            market: 'bg-yellow-400',
            kitchen_hut: 'bg-red-400',
            dock: 'bg-blue-400',
            shrine: 'bg-pink-400',
            farm: 'bg-green-400',
          };
          
          return (
            <div
              key={poi.poiId}
              className={`absolute w-2 h-2 ${poiColors[poi.type] || 'bg-purple-400'} rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-80`}
              style={{
                left: `${Math.max(10, Math.min(90, x))}%`,
                top: `${Math.max(10, Math.min(90, y))}%`,
              }}
            />
          );
        })}
        
        {/* Player indicator with direction */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
          style={{
            left: `${50 + (position[0] / mapSize) * 40}%`,
            top: `${50 + (position[2] / mapSize) * 40}%`,
          }}
        >
          {/* Direction indicator */}
          <div 
            className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-cyan-400 absolute -top-2 left-1/2 -translate-x-1/2 drop-shadow-glow"
            style={{ transform: `translateX(-50%) rotate(${-rotation}rad)` }}
          />
          {/* Player dot */}
          <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-glow-cyan animate-pulse-slow" />
        </div>
        
        {/* Compass */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-cyan-300 drop-shadow">
          N
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-cyan-300/50">
          S
        </div>
        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-cyan-300/50">
          W
        </div>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-cyan-300/50">
          E
        </div>
        
        {/* Frame decoration */}
        <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-lg pointer-events-none" />
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
      </div>
    </Card>
  );
}

// ============================================
// Enhanced Stamina Bar
// ============================================
function StaminaBar() {
  const stamina = usePlayerStore((s) => s.stamina);
  const maxStamina = usePlayerStore((s) => s.maxStamina);
  const percentage = (stamina / maxStamina) * 100;
  
  const getColor = () => {
    if (percentage > 60) return 'bg-emerald-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500 animate-pulse';
  };
  
  return (
    <Card className="hud-card px-3 py-2.5 bg-card/95 backdrop-blur-md border-primary/20 w-44 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚡</span>
        <div className="flex-1">
          <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full ${getColor()} transition-all duration-300 rounded-full shadow-sm`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
            {Math.round(stamina)}/{maxStamina}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Dish Progress Tracker
// ============================================
function DishProgress() {
  const world = useWorldStore((s) => s.world);
  const completedSteps = usePlayerStore((s) => s.completedCookingSteps);
  
  if (!world) return null;
  
  const totalArcs = world.questArcs.length;
  const completedArcs = world.questArcs.filter(
    arc => arc.unlocksCookingStepId && completedSteps.includes(arc.unlocksCookingStepId)
  ).length;
  
  const percentage = totalArcs > 0 ? (completedArcs / totalArcs) * 100 : 0;
  
  return (
    <Card className="hud-card px-3 py-2.5 bg-gradient-to-r from-amber-900/90 to-orange-900/90 border-amber-500/30 w-44 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">🍳</span>
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-amber-200 truncate">{world.dish.name}</p>
          <div className="h-1.5 bg-amber-950/50 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[9px] text-amber-300/70 mt-0.5">
            {completedArcs}/{totalArcs} steps complete
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Quest Tracker - Enhanced
// ============================================
function QuestTracker() {
  const activeQuests = usePlayerStore((s) => s.activeQuests);
  
  if (activeQuests.length === 0) {
    return (
      <Card className="hud-card px-4 py-3 bg-card/90 backdrop-blur-md border-muted/30 max-w-xs shadow-lg">
        <div className="text-center py-2">
          <span className="text-2xl mb-2 block">📜</span>
          <p className="text-xs text-muted-foreground">No active quests</p>
          <p className="text-[10px] text-muted-foreground/70">Talk to NPCs to find quests!</p>
        </div>
      </Card>
    );
  }
  
  const currentQuest = activeQuests[0];
  const completedObjectives = currentQuest.objectives.filter((o) => o.completed).length;
  const totalObjectives = currentQuest.objectives.length;
  const progress = (completedObjectives / totalObjectives) * 100;
  
  return (
    <Card className="hud-card px-4 py-3 bg-card/95 backdrop-blur-md border-primary/20 max-w-xs shadow-lg animate-in slide-in-from-right">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">📜</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Quest</span>
          </div>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {completedObjectives}/{totalObjectives}
          </Badge>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-sm font-semibold text-foreground">{currentQuest.title}</p>
        
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {currentQuest.objectives.map((objective, i) => (
            <div
              key={objective.objectiveId}
              className={`text-xs flex items-start gap-2 p-1.5 rounded transition-all ${
                objective.completed 
                  ? 'text-muted-foreground bg-muted/30 line-through opacity-60' 
                  : 'text-foreground bg-primary/10'
              }`}
            >
              <span className={`mt-0.5 ${objective.completed ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {objective.completed ? '✓' : '○'}
              </span>
              <span className="flex-1">{objective.description}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Interaction Prompt - Enhanced
// ============================================
function InteractionPrompt() {
  const prompt = useGameStore((s) => s.interactionPrompt);
  
  if (!prompt.visible) return null;
  
  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-200 z-50">
      <Card className="px-6 py-3 bg-card/98 backdrop-blur-md border-primary shadow-2xl shadow-primary/20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <kbd className="px-3 py-1.5 text-sm font-bold font-mono bg-primary text-primary-foreground rounded-lg shadow-lg animate-bounce-subtle">
              E
            </kbd>
            <div className="absolute inset-0 bg-primary rounded-lg blur-md opacity-50 -z-10" />
          </div>
          <span className="text-sm font-semibold text-foreground">{prompt.text}</span>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Quick Action Buttons - Enhanced
// ============================================
function QuickActions() {
  const toggleJournal = useGameStore((s) => s.toggleJournal);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const toggleCooking = useGameStore((s) => s.toggleCooking);
  const inventory = usePlayerStore((s) => s.inventory);
  
  const itemCount = inventory.reduce((acc, stack) => acc + stack.quantity, 0);
  
  return (
    <Card className="hud-card bg-card/95 backdrop-blur-md border-primary/20 p-1.5 shadow-lg">
      <div className="flex gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleInventory}
          className="w-11 h-11 p-0 relative hover:bg-primary/20 hover:scale-105 transition-all"
          title="Inventory (I)"
        >
          <span className="text-xl">🎒</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
              {itemCount}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleJournal}
          className="w-11 h-11 p-0 hover:bg-primary/20 hover:scale-105 transition-all"
          title="Journal (J)"
        >
          <span className="text-xl">📔</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCooking}
          className="w-11 h-11 p-0 hover:bg-primary/20 hover:scale-105 transition-all"
          title="Cooking (C)"
        >
          <span className="text-xl">🍳</span>
        </Button>
      </div>
    </Card>
  );
}

// ============================================
// Controls Help - Enhanced
// ============================================
function ControlsHelp() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card 
      className="hud-card px-3 py-2 bg-card/90 backdrop-blur-md border-muted/30 cursor-pointer transition-all hover:bg-card/95 shadow-lg"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-sm">🎮</span>
        <span className="font-medium">Controls</span>
        <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </div>
      
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Move</span>
            <div className="flex gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">WASD</kbd>
              <span className="text-muted-foreground">/</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓←→</kbd>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Sprint</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift</kbd>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Interact</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">E</kbd>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pause</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">ESC</kbd>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Quick Menu</span>
            <div className="flex gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">I</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">J</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">C</kbd>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================
// FPS Counter (Development)
// ============================================
function FPSCounter() {
  const [fps, setFps] = useState(60);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const animId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animId);
  }, []);
  
  const fpsColor = fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <div className={`text-[10px] font-mono ${fpsColor} opacity-60`}>
      {fps} FPS
    </div>
  );
}

// ============================================
// Main HUD Component
// ============================================
export function HUD() {
  const isPlaying = useGameStore((s) => s.isPlaying);
  
  if (!isPlaying) return null;
  
  return (
    <div className="hud-overlay fixed inset-0 pointer-events-none z-40">
      {/* Top Left - Time, Region, Stamina, Dish Progress */}
      <div className="absolute top-4 left-4 space-y-2.5 pointer-events-auto">
        <TimeDisplay />
        <RegionDisplay />
        <StaminaBar />
        <DishProgress />
      </div>
      
      {/* Top Right - Mini Map */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <MiniMap />
        <div className="mt-1 text-right">
          <FPSCounter />
        </div>
      </div>
      
      {/* Right Side - Quest Tracker */}
      <div className="absolute top-48 right-4 pointer-events-auto">
        <QuestTracker />
      </div>
      
      {/* Bottom Left - Quick Actions & Controls */}
      <div className="absolute bottom-4 left-4 space-y-2 pointer-events-auto">
        <QuickActions />
        <ControlsHelp />
      </div>
      
      {/* Center Bottom - Interaction Prompt */}
      <InteractionPrompt />
      
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/20 pointer-events-none" />
    </div>
  );
}

export default HUD;
