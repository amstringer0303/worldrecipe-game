'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { HUD } from '@/components/ui/HUD';
import { DialogueModal } from '@/components/ui/DialogueModal';
import { JournalPanel } from '@/components/ui/JournalPanel';
import { InventoryPanel } from '@/components/ui/InventoryPanel';
import { CookingUI } from '@/components/ui/CookingUI';
import { useGameStore } from '@/lib/store/gameStore';
import { useWorldStore } from '@/lib/store/worldStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamic import for Canvas3D to avoid SSR issues
const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-lg font-medium text-foreground">Loading World Recipe...</p>
        <p className="text-sm text-muted-foreground mt-2">Preparing your culinary adventure</p>
      </div>
    </div>
  ),
});

// ============================================
// Pause Menu
// ============================================

function PauseMenu() {
  const setPaused = useGameStore((s) => s.setPaused);
  const toggleJournal = useGameStore((s) => s.toggleJournal);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const world = useWorldStore((s) => s.world);
  const playTimeSeconds = useGameStore((s) => s.playTimeSeconds);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">⏸️ Paused</CardTitle>
          {world && (
            <p className="text-sm text-muted-foreground">
              {world.dish.name} • {formatTime(playTimeSeconds)} played
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full h-12"
            onClick={() => setPaused(false)}
          >
            ▶️ Resume
          </Button>
          <Button 
            variant="outline"
            className="w-full h-12"
            onClick={() => {
              toggleJournal();
              setPaused(false);
            }}
          >
            📔 Journal
          </Button>
          <Button 
            variant="outline"
            className="w-full h-12"
            onClick={() => {
              toggleInventory();
              setPaused(false);
            }}
          >
            🎒 Inventory
          </Button>
          <Button 
            variant="outline"
            className="w-full h-12"
            onClick={() => window.location.href = '/'}
          >
            🏠 Main Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Dish Complete Ceremony
// ============================================

function DishCompleteCeremony({ onClose }: { onClose: () => void }) {
  const world = useWorldStore((s) => s.world);
  const playTimeSeconds = useGameStore((s) => s.playTimeSeconds);
  const relationships = usePlayerStore((s) => s.npcRelationships);
  
  if (!world) return null;
  
  const friendsMade = Object.values(relationships).filter((r) => r >= 5).length;
  const totalFriendship = Object.values(relationships).reduce((sum, r) => sum + r, 0);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="text-center animate-in zoom-in duration-500">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-4xl font-bold text-white mb-2">
          {world.dish.name} Complete!
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {world.dish.tagline}
        </p>
        
        <Card className="max-w-md mx-auto bg-card/90 backdrop-blur-md mb-8">
          <CardContent className="p-6 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{formatTime(playTimeSeconds)}</p>
              <p className="text-sm text-muted-foreground">Time Played</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{friendsMade}</p>
              <p className="text-sm text-muted-foreground">Friends Made</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{world.regions.length}</p>
              <p className="text-sm text-muted-foreground">Regions Visited</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{totalFriendship}</p>
              <p className="text-sm text-muted-foreground">Total Friendship</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-x-4">
          <Button size="lg" onClick={onClose}>
            Continue Playing
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = '/'}>
            New Adventure
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Game Page
// ============================================

export default function GamePage() {
  const [showComplete, setShowComplete] = useState(false);
  const isPaused = useGameStore((s) => s.isPaused);
  const setPaused = useGameStore((s) => s.setPaused);
  const dialogueActive = useGameStore((s) => s.dialogueState.active);
  const world = useWorldStore((s) => s.world);
  const setWorld = useWorldStore((s) => s.setWorld);
  const isLoading = useWorldStore((s) => s.isLoading);
  const completedSteps = usePlayerStore((s) => s.completedCookingSteps);
  
  // Load fallback world on mount if no world exists
  useEffect(() => {
    if (!world && !isLoading) {
      // Load the fallback world for demo
      const loadWorld = async () => {
        try {
          const res = await fetch('/api/ai/world', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dishPrompt: 'Simple Ramen',
              seed: 'demo-seed',
            }),
          });
          
          const data = await res.json();
          
          if (data.world) {
            setWorld(data.world);
          } else if (data.error) {
            console.error('World generation error:', data.error);
            // Try to use any fallback world included in error response
            if (data.fallbackWorld) {
              setWorld(data.fallbackWorld);
            }
          }
        } catch (error) {
          console.error('Failed to load world:', error);
        }
      };
      
      loadWorld();
    }
  }, [world, setWorld, isLoading]);
  
  // Handle escape key for pause and other shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if dialogue is active (dialogue handles its own escape)
      if (dialogueActive) return;
      
      if (e.code === 'Escape') {
        setPaused(!isPaused);
      }
      
      // Additional shortcuts when not paused
      if (!isPaused) {
        switch (e.code) {
          case 'KeyI':
            useGameStore.getState().toggleInventory();
            break;
          case 'KeyJ':
            useGameStore.getState().toggleJournal();
            break;
          case 'KeyC':
            useGameStore.getState().toggleCooking();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, setPaused, dialogueActive]);
  
  // Check if dish is complete
  useEffect(() => {
    if (!world) return;
    
    const allStepsComplete = world.questArcs.every((arc) => 
      arc.unlocksCookingStepId && completedSteps.includes(arc.unlocksCookingStepId)
    );
    
    if (allStepsComplete && world.questArcs.length > 0 && completedSteps.length > 0) {
      setShowComplete(true);
    }
  }, [world, completedSteps]);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-lg font-medium text-foreground">Generating World...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <Suspense fallback={null}>
        <GameCanvas />
      </Suspense>
      
      {/* UI Overlays */}
      <HUD />
      <DialogueModal />
      <JournalPanel />
      <InventoryPanel />
      <CookingUI />
      
      {/* Pause Menu */}
      {isPaused && !dialogueActive && <PauseMenu />}
      
      {/* Dish Complete Ceremony */}
      {showComplete && <DishCompleteCeremony onClose={() => setShowComplete(false)} />}
    </main>
  );
}
