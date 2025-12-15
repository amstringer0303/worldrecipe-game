'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useWorldStore } from '@/lib/store/worldStore';
import type { DialogueTurn } from '@/lib/ai/schemas';

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
    quest_complete: '🏆',
    trade: '🔄',
    hint: '💡',
    farewell: '👋',
    deliver: '📦',
  };
  
  const effectColors: Record<string, string> = {
    quest_accept: 'border-yellow-500/50 bg-yellow-500/10',
    trade: 'border-cyan-500/50 bg-cyan-500/10',
    quest_complete: 'border-green-500/50 bg-green-500/10',
  };
  
  const icon = choice.effect ? effectIcons[choice.effect.type] || '' : '';
  const extraClass = choice.effect ? effectColors[choice.effect.type] || '' : '';
  
  return (
    <Button
      variant="outline"
      className={`w-full justify-start text-left h-auto py-3 px-4 hover:bg-accent/50 transition-all ${extraClass}`}
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
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  
  const updateRelationship = usePlayerStore((s) => s.updateRelationship);
  const getRelationship = usePlayerStore((s) => s.getRelationship);
  const activeQuests = usePlayerStore((s) => s.activeQuests);
  const inventory = usePlayerStore((s) => s.inventory);
  const acceptQuest = usePlayerStore((s) => s.acceptQuest);
  const completeQuest = usePlayerStore((s) => s.completeQuest);
  const addConversationMemory = usePlayerStore((s) => s.addConversationMemory);
  const getConversationMemory = usePlayerStore((s) => s.getConversationMemory);
  const completedQuestIds = usePlayerStore((s) => s.completedQuestIds);
  
  const getNPC = useWorldStore((s) => s.getNPC);
  const world = useWorldStore((s) => s.world);
  const getAvailableQuestsForNPC = useWorldStore((s) => s.getAvailableQuestsForNPC);
  const getTradeableIngredients = useWorldStore((s) => s.getTradeableIngredients);
  const getQuestChapter = useWorldStore((s) => s.getQuestChapter);
  
  const [currentDialogue, setCurrentDialogue] = useState<DialogueTurn | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [textComplete, setTextComplete] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string | null>(null);
  
  const npcId = dialogueState.currentNpcId;
  const npc = npcId ? getNPC(npcId) : null;
  
  // Fetch dialogue when dialogue starts
  useEffect(() => {
    if (dialogueState.active && npcId && !currentDialogue) {
      fetchDialogue();
    }
  }, [dialogueState.active, npcId]);
  
  const fetchDialogue = async () => {
    if (!npcId || !world) return;
    
    setIsLoading(true);
    setTextComplete(false);
    
    try {
      const relationship = getRelationship(npcId);
      const activeQuestIds = activeQuests.map(q => q.questId);
      
      // Get available quests for this NPC
      const availableQuests = getAvailableQuestsForNPC(
        npcId, 
        activeQuestIds, 
        completedQuestIds
      ).map(q => ({
        questId: q.questId,
        title: q.title,
        description: q.description,
      }));
      
      // Get active quests with this NPC
      const activeQuestsWithThisNPC = activeQuests
        .filter(q => q.giverNpcId === npcId)
        .map(q => ({
          questId: q.questId,
          title: q.title,
          objectives: q.objectives.map(o => ({
            description: o.description,
            completed: o.completed,
          })),
        }));
      
      // Get tradeable ingredients
      const tradeableIngredients = getTradeableIngredients(npcId);
      
      // Get conversation history
      const conversationHistory = getConversationMemory(npcId);
      
      // Get player inventory summary
      const playerInventory = inventory.slice(0, 10).map(s => ({
        name: s.item.name,
        quantity: s.quantity,
      }));
      
      const response = await fetch('/api/ai/npc/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId: world.worldId,
          npcId,
          context: {
            relationshipLevel: relationship,
            activeQuests: activeQuestIds,
            activeQuestsWithThisNPC,
            availableQuests,
            playerInventory,
            tradeableIngredients,
            conversationHistory,
            currentTimeOfDay: timeOfDay,
            playerName: 'Chef', // Could be customizable
          },
        }),
      });
      
      const data = await response.json();
      setCurrentDialogue(data.dialogue);
      setConversationSummary(data.conversationSummary);
    } catch (error) {
      console.error('Failed to fetch dialogue:', error);
      // Set fallback dialogue
      setCurrentDialogue({
        speaker: npc?.name || 'NPC',
        text: "Hello there! It's nice to see you today. How can I help you?",
        emotion: 'happy',
        choices: [
          { text: "Nice to meet you!", effect: { type: 'relationship', value: 1 } },
          { text: "Goodbye", effect: { type: 'farewell' } },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChoiceSelect = useCallback((choice: { text: string; effect?: { type: string; value?: string | number } }) => {
    if (!npcId) return;
    
    // Apply effect
    if (choice.effect) {
      switch (choice.effect.type) {
        case 'relationship':
          updateRelationship(
            npcId, 
            typeof choice.effect.value === 'number' ? choice.effect.value : 1
          );
          break;
          
        case 'quest_accept':
          // Accept the quest
          if (typeof choice.effect.value === 'string') {
            const quest = getQuestChapter(choice.effect.value);
            if (quest) {
              acceptQuest(quest);
              // Also boost relationship
              updateRelationship(npcId, 1);
            }
          }
          break;
          
        case 'quest_complete':
          // Complete the quest
          if (typeof choice.effect.value === 'string') {
            completeQuest(choice.effect.value);
            updateRelationship(npcId, 2);
          }
          break;
          
        case 'trade':
          // Open trade modal
          setShowTradeModal(true);
          return; // Don't close dialogue
          
        case 'deliver':
          // Handle delivery - would need specific item logic
          break;
          
        case 'farewell':
          // Save conversation memory before closing
          if (conversationSummary) {
            addConversationMemory(npcId, conversationSummary);
          }
          handleClose();
          return;
          
        case 'hint':
          // Could show a hint toast
          break;
      }
    }
    
    // Save conversation memory
    if (conversationSummary) {
      addConversationMemory(npcId, `${choice.text} - ${conversationSummary}`);
    }
    
    // Close after choice (or continue to next dialogue node in future)
    handleClose();
  }, [npcId, updateRelationship, acceptQuest, completeQuest, getQuestChapter, addConversationMemory, conversationSummary]);
  
  const handleClose = useCallback(() => {
    setCurrentDialogue(null);
    setTextComplete(false);
    setShowTradeModal(false);
    setConversationSummary(null);
    endDialogue();
  }, [endDialogue]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialogueState.active) return;
      
      if (e.code === 'Escape') {
        if (showTradeModal) {
          setShowTradeModal(false);
        } else {
          handleClose();
        }
        return;
      }
      
      // Number keys for choices
      if (currentDialogue?.choices && textComplete && !showTradeModal) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= currentDialogue.choices.length) {
          handleChoiceSelect(currentDialogue.choices[num - 1]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogueState.active, currentDialogue, textComplete, showTradeModal, handleClose, handleChoiceSelect]);
  
  if (!dialogueState.active) return null;
  
  // Emotion emoji mapping
  const emotionEmojis: Record<string, string> = {
    neutral: '😐',
    happy: '😊',
    sad: '😢',
    excited: '🤩',
    thoughtful: '🤔',
    worried: '😟',
    surprised: '😲',
    grateful: '🥹',
  };
  
  const relationship = npcId ? getRelationship(npcId) : 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 pointer-events-auto"
        onClick={handleClose}
      />
      
      <div className="pointer-events-auto w-full max-w-2xl animate-in slide-in-from-bottom duration-300 relative z-10">
        <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Character portrait */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-3xl border-2 border-primary/30">
                  {currentDialogue?.emotion 
                    ? emotionEmojis[currentDialogue.emotion] || '😊'
                    : '😊'
                  }
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {currentDialogue?.speaker || npc?.name || 'Loading...'}
                    {npc?.personality?.archetype && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {npc.personality.archetype}
                      </Badge>
                    )}
                  </CardTitle>
                  {npc && (
                    <p className="text-sm text-muted-foreground">{npc.role.job}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Relationship indicator */}
                <Badge variant="secondary" className="text-xs">
                  <span className="mr-1">
                    {relationship >= 7 ? '💖' : relationship >= 4 ? '❤️' : relationship >= 1 ? '💛' : '🤍'}
                  </span>
                  {relationship}/10
                </Badge>
                
                {/* Close button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleClose}
                >
                  ✕
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Dialogue text */}
            <div className="min-h-[80px] p-4 bg-muted/30 rounded-lg border border-border/30">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
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
            
            {/* Dialogue tags */}
            {currentDialogue?.tags && currentDialogue.tags.length > 0 && textComplete && (
              <div className="flex gap-1 flex-wrap">
                {currentDialogue.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Choices */}
            {textComplete && currentDialogue?.choices && currentDialogue.choices.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom duration-300">
                <p className="text-xs text-muted-foreground mb-2">Choose a response:</p>
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
            {textComplete && (!currentDialogue?.choices || currentDialogue.choices.length === 0) && (
              <div className="text-center pt-2">
                <Button onClick={handleClose} variant="ghost" size="sm">
                  Press <kbd className="mx-1 px-2 py-0.5 bg-muted rounded text-xs">ESC</kbd> to close
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Trade Modal Overlay */}
      {showTradeModal && npc && (
        <TradeModal 
          npcId={npcId!}
          npcName={npc.name}
          onClose={() => setShowTradeModal(false)}
        />
      )}
    </div>
  );
}

// ============================================
// Trade Modal Component
// ============================================

interface TradeModalProps {
  npcId: string;
  npcName: string;
  onClose: () => void;
}

function TradeModal({ npcId, npcName, onClose }: TradeModalProps) {
  const world = useWorldStore((s) => s.world);
  const currentRegion = useWorldStore((s) => s.currentRegion);
  const addItem = usePlayerStore((s) => s.addItem);
  const removeItem = usePlayerStore((s) => s.removeItem);
  const inventory = usePlayerStore((s) => s.inventory);
  
  // Get tradeable ingredients for this NPC
  const tradeableIngredients = world?.ingredientGraph.ingredients.filter(i => 
    i.gatherMethod === 'trade' && 
    i.regionId === currentRegion?.regionId
  ) || [];
  
  const handleTrade = (ingredientId: string, ingredientName: string) => {
    // Simple trade: just add the item (in a full game, would require currency or barter)
    const success = addItem({
      itemId: ingredientId,
      name: ingredientName,
      description: `A fresh ${ingredientName}`,
      category: 'ingredient',
      rarity: 'common',
    });
    
    if (success) {
      // Notification is handled by addItem
      console.log(`Traded for ${ingredientName}`);
    }
  };
  
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md bg-card/95 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔄 Trade with {npcName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tradeableIngredients.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">Available items:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tradeableIngredients.map((ingredient) => (
                  <div 
                    key={ingredient.ingredientId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                  >
                    <div>
                      <p className="font-medium">{ingredient.name}</p>
                      <p className="text-xs text-muted-foreground">{ingredient.category}</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleTrade(ingredient.ingredientId, ingredient.name)}
                    >
                      Get
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No items available for trade right now.
            </p>
          )}
          
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DialogueModal;

