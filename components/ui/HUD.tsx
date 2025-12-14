'use client';

import { useGameStore } from '@/lib/store/gameStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================
// Time Display Component
// ============================================
function TimeDisplay() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const dayNumber = useGameStore((s) => s.dayNumber);
  
  const timeIcons: Record<string, string> = {
    morning: '🌅',
    day: '☀️',
    evening: '🌆',
    night: '🌙',
  };
  
  const timeLabels: Record<string, string> = {
    morning: 'Morning',
    day: 'Daytime',
    evening: 'Evening',
    night: 'Night',
  };
  
  return (
    <Card className="px-4 py-2 bg-card/90 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{timeIcons[timeOfDay]}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{timeLabels[timeOfDay]}</p>
          <p className="text-xs text-muted-foreground">Day {dayNumber}</p>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Mini Map Component (Placeholder)
// ============================================
function MiniMap() {
  const position = usePlayerStore((s) => s.position);
  
  return (
    <Card className="w-32 h-32 bg-card/90 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="relative w-full h-full bg-muted/50">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border border-border/20" />
          ))}
        </div>
        
        {/* Player dot */}
        <div
          className="absolute w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-glow"
          style={{
            left: `${50 + (position[0] / 20) * 40}%`,
            top: `${50 + (position[2] / 20) * 40}%`,
          }}
        />
        
        {/* North indicator */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
          N
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Stamina Bar
// ============================================
function StaminaBar() {
  const stamina = usePlayerStore((s) => s.stamina);
  const maxStamina = usePlayerStore((s) => s.maxStamina);
  
  return (
    <Card className="px-3 py-2 bg-card/90 backdrop-blur-sm border-border/50 w-40">
      <div className="flex items-center gap-2">
        <span className="text-sm">⚡</span>
        <Progress value={(stamina / maxStamina) * 100} className="h-2" />
      </div>
    </Card>
  );
}

// ============================================
// Quest Tracker
// ============================================
function QuestTracker() {
  const activeQuests = usePlayerStore((s) => s.activeQuests);
  
  if (activeQuests.length === 0) {
    return null;
  }
  
  const currentQuest = activeQuests[0];
  const completedObjectives = currentQuest.objectives.filter((o) => o.completed).length;
  const totalObjectives = currentQuest.objectives.length;
  
  return (
    <Card className="px-4 py-3 bg-card/90 backdrop-blur-sm border-border/50 max-w-xs">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Current Quest</span>
          <Badge variant="secondary" className="text-xs">
            {completedObjectives}/{totalObjectives}
          </Badge>
        </div>
        <p className="text-sm font-semibold text-foreground">{currentQuest.title}</p>
        <div className="space-y-1">
          {currentQuest.objectives.map((objective) => (
            <div
              key={objective.objectiveId}
              className={`text-xs flex items-center gap-2 ${
                objective.completed ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}
            >
              <span>{objective.completed ? '✓' : '○'}</span>
              <span>{objective.description}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Interaction Prompt
// ============================================
function InteractionPrompt() {
  const prompt = useGameStore((s) => s.interactionPrompt);
  
  if (!prompt.visible) return null;
  
  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <Card className="px-6 py-3 bg-card/95 backdrop-blur-sm border-primary/50 shadow-lg">
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">E</kbd>
          <span className="text-sm font-medium text-foreground">{prompt.text}</span>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Quick Action Buttons
// ============================================
function QuickActions() {
  const toggleJournal = useGameStore((s) => s.toggleJournal);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const toggleCooking = useGameStore((s) => s.toggleCooking);
  
  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50 p-2">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleInventory}
          className="w-10 h-10 p-0"
          title="Inventory (I)"
        >
          🎒
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleJournal}
          className="w-10 h-10 p-0"
          title="Journal (J)"
        >
          📔
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCooking}
          className="w-10 h-10 p-0"
          title="Cooking (C)"
        >
          🍳
        </Button>
      </div>
    </Card>
  );
}

// ============================================
// Controls Help
// ============================================
function ControlsHelp() {
  return (
    <Card className="px-3 py-2 bg-card/90 backdrop-blur-sm border-border/50">
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">WASD</kbd>/<kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↑↓←→</kbd> Move</span>
        <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">E</kbd> Interact</span>
        <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">ESC</kbd> Pause</span>
      </div>
    </Card>
  );
}

// ============================================
// Main HUD Component
// ============================================
export function HUD() {
  const isPlaying = useGameStore((s) => s.isPlaying);
  
  if (!isPlaying) return null;
  
  return (
    <div className="hud-overlay fixed inset-0 pointer-events-none z-50">
      {/* Top Left - Time and Day */}
      <div className="absolute top-4 left-4 space-y-3">
        <TimeDisplay />
        <StaminaBar />
      </div>
      
      {/* Top Right - Mini Map */}
      <div className="absolute top-4 right-4">
        <MiniMap />
      </div>
      
      {/* Right Side - Quest Tracker */}
      <div className="absolute top-40 right-4">
        <QuestTracker />
      </div>
      
      {/* Bottom Left - Quick Actions */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <QuickActions />
        <ControlsHelp />
      </div>
      
      {/* Center Bottom - Interaction Prompt */}
      <InteractionPrompt />
    </div>
  );
}

export default HUD;

