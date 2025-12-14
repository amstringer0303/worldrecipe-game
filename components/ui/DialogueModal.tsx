'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useWorldStore } from '@/lib/store/worldStore';
import type { DialogueTurn, DialogueChoice } from '@/lib/ai/schemas';

// ============================================
// Typewriter Effect Component
// ============================================

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        onComplete?.();
        clearInterval(interval);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [text, onComplete]);
  
  return (
    <p className="text-base leading-relaxed text-foreground min-h-[60px]">
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </p>
  );
}

// ============================================
// Dialogue Choice Button
// ============================================

interface DialogueChoiceButtonProps {
  choice: {
    text: string;
    effect?: {
      type: string;
      value?: string | number;
    };
  };
  index: number;
  onClick: () => void;
  disabled: boolean;
}

function DialogueChoiceButton({ choice, index, onClick, disabled }: DialogueChoiceButtonProps) {
  const effectIcons: Record<string, string> = {
    relationship: '❤️',
    quest_accept: '📜',
    quest_progress: '✅',
    trade: '🔄',
    hint: '💡',
    farewell: '👋',
  };
  
  const icon = choice.effect ? effectIcons[choice.effect.type] || '' : '';
  
  return (
    <Button
      variant="outline"
      className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-accent/50 transition-all"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex items-center gap-3 w-full">
        <span className="w-6 h-6 flex items-center justify-center bg-muted rounded text-xs font-mono">
          {index + 1}
        </span>
        <span className="flex-1">{choice.text}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </span>
    </Button>
  );
}

// ============================================
// Main Dialogue Modal
// ============================================

export function DialogueModal() {
  const dialogueState = useGameStore((s) => s.dialogueState);
  const endDialogue = useGameStore((s) => s.endDialogue);
  const updateRelationship = usePlayerStore((s) => s.updateRelationship);
  const getNPC = useWorldStore((s) => s.getNPC);
  
  const [currentDialogue, setCurrentDialogue] = useState<DialogueTurn | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [textComplete, setTextComplete] = useState(false);
  
  const npc = dialogueState.currentNpcId 
    ? getNPC(dialogueState.currentNpcId) 
    : null;
  
  // Fetch dialogue when dialogue starts
  useEffect(() => {
    if (dialogueState.active && dialogueState.currentNpcId && !currentDialogue) {
      fetchDialogue();
    }
  }, [dialogueState.active, dialogueState.currentNpcId]);
  
  const fetchDialogue = async () => {
    if (!dialogueState.currentNpcId) return;
    
    setIsLoading(true);
    setTextComplete(false);
    
    try {
      const response = await fetch('/api/ai/npc/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId: useWorldStore.getState().world?.worldId,
          npcId: dialogueState.currentNpcId,
          context: {
            relationshipLevel: usePlayerStore.getState().getRelationship(dialogueState.currentNpcId),
            activeQuests: usePlayerStore.getState().activeQuests.map(q => q.questId),
            currentTimeOfDay: useGameStore.getState().timeOfDay,
          },
        }),
      });
      
      const data = await response.json();
      setCurrentDialogue(data.dialogue);
    } catch (error) {
      console.error('Failed to fetch dialogue:', error);
      // Set fallback dialogue
      setCurrentDialogue({
        speaker: npc?.name || 'NPC',
        text: "Hello there! It's nice to see you.",
        emotion: 'happy',
        choices: [
          { text: "Nice to meet you too!" },
          { text: "Goodbye" },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChoiceSelect = useCallback((choice: { text: string; effect?: { type: string; value?: string | number } }) => {
    if (!dialogueState.currentNpcId) return;
    
    // Apply effect
    if (choice.effect) {
      switch (choice.effect.type) {
        case 'relationship':
          updateRelationship(
            dialogueState.currentNpcId, 
            typeof choice.effect.value === 'number' ? choice.effect.value : 1
          );
          break;
        case 'farewell':
          handleClose();
          return;
        // Other effects can be handled here
      }
    }
    
    // For now, just close after any choice
    // In a full implementation, this would advance to the next dialogue node
    handleClose();
  }, [dialogueState.currentNpcId, updateRelationship]);
  
  const handleClose = useCallback(() => {
    setCurrentDialogue(null);
    setTextComplete(false);
    endDialogue();
  }, [endDialogue]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialogueState.active) return;
      
      if (e.code === 'Escape') {
        handleClose();
        return;
      }
      
      // Number keys for choices
      if (currentDialogue?.choices && textComplete) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= currentDialogue.choices.length) {
          handleChoiceSelect(currentDialogue.choices[num - 1]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogueState.active, currentDialogue, textComplete, handleClose, handleChoiceSelect]);
  
  if (!dialogueState.active) return null;
  
  // Emotion emoji mapping
  const emotionEmojis: Record<string, string> = {
    neutral: '😐',
    happy: '😊',
    sad: '😢',
    excited: '🤩',
    thoughtful: '🤔',
    worried: '😟',
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl animate-in slide-in-from-bottom duration-300">
        <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Character portrait placeholder */}
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                  {currentDialogue?.emotion 
                    ? emotionEmojis[currentDialogue.emotion] || '😊'
                    : '😊'
                  }
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {currentDialogue?.speaker || npc?.name || 'Loading...'}
                  </CardTitle>
                  {npc && (
                    <p className="text-xs text-muted-foreground">{npc.role.job}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                ❤️ {usePlayerStore.getState().getRelationship(dialogueState.currentNpcId || '')}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Dialogue text */}
            <div className="min-h-[80px] p-4 bg-muted/30 rounded-lg">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                </div>
              ) : currentDialogue ? (
                <TypewriterText 
                  text={currentDialogue.text} 
                  onComplete={() => setTextComplete(true)}
                />
              ) : (
                <p className="text-muted-foreground">...</p>
              )}
            </div>
            
            {/* Choices */}
            {textComplete && currentDialogue?.choices && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom duration-300">
                {currentDialogue.choices.map((choice, index) => (
                  <DialogueChoiceButton
                    key={index}
                    choice={choice}
                    index={index}
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            )}
            
            {/* Continue hint */}
            {textComplete && !currentDialogue?.choices && (
              <div className="text-center">
                <Button onClick={handleClose} variant="ghost">
                  Press <kbd className="mx-1 px-2 py-0.5 bg-muted rounded text-xs">ESC</kbd> to close
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DialogueModal;

