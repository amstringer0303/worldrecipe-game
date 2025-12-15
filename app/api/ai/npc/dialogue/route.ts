import { NextResponse } from 'next/server';
import { gateway } from '@ai-sdk/gateway';
import { streamText, generateObject } from 'ai';
import { dialogueTurnSchema } from '@/lib/ai/schemas';
import { DIALOGUE_SYSTEM_PROMPT, buildDialoguePrompt, type EnhancedDialogueContext } from '@/lib/ai/prompts';
import { db } from '@/lib/db/client';
import { worlds } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// NPC Dialogue Generation API
// ============================================

export const maxDuration = 30;

interface DialogueRequest {
  worldId: string;
  npcId: string;
  context: {
    relationshipLevel: number;
    activeQuests: string[];
    activeQuestsWithThisNPC?: { questId: string; title: string; objectives: { description: string; completed: boolean }[] }[];
    availableQuests?: { questId: string; title: string; description: string }[];
    playerInventory?: { name: string; quantity: number }[];
    tradeableIngredients?: string[];
    conversationHistory?: string[];
    currentTimeOfDay: string;
    playerName?: string;
  };
  stream?: boolean;
}

// POST handler for structured dialogue generation
export async function POST(request: Request) {
  try {
    const body: DialogueRequest = await request.json();
    
    if (!body.worldId || !body.npcId) {
      return NextResponse.json(
        { error: 'worldId and npcId are required' },
        { status: 400 }
      );
    }
    
    // Get the world and find the NPC
    const world = await db.query.worlds.findFirst({
      where: eq(worlds.worldId, body.worldId),
    });
    
    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }
    
    const worldData = JSON.parse(world.worldJson);
    const npc = worldData.npcRoster.find((n: { npcId: string }) => n.npcId === body.npcId);
    
    if (!npc) {
      return NextResponse.json(
        { error: 'NPC not found' },
        { status: 404 }
      );
    }
    
    // Build the enhanced context
    const enhancedContext: EnhancedDialogueContext = {
      relationshipLevel: body.context.relationshipLevel,
      activeQuests: body.context.activeQuests,
      currentTimeOfDay: body.context.currentTimeOfDay,
      availableQuests: body.context.availableQuests,
      activeQuestsWithThisNPC: body.context.activeQuestsWithThisNPC,
      playerInventory: body.context.playerInventory,
      tradeableIngredients: body.context.tradeableIngredients,
      conversationHistory: body.context.conversationHistory,
      playerName: body.context.playerName,
    };
    
    // Build the prompt
    const prompt = buildDialoguePrompt(npc, enhancedContext);
    
    // Check if streaming is requested
    if (body.stream) {
      // Use streamText for real-time dialogue
      const result = await streamText({
        model: gateway('openai/gpt-4o-mini'),
        system: DIALOGUE_SYSTEM_PROMPT,
        prompt,
        temperature: 0.8,
      });
      
      return result.toTextStreamResponse();
    }
    
    // Use generateObject for structured output
    const { object: dialogue } = await generateObject({
      model: gateway('openai/gpt-4o-mini'),
      schema: dialogueTurnSchema,
      system: DIALOGUE_SYSTEM_PROMPT,
      prompt,
      temperature: 0.8,
    });
    
    // Set the speaker
    dialogue.speaker = npc.name;
    
    // Generate a conversation summary for memory
    const conversationSummary = `${npc.name} and player discussed: ${
      dialogue.text.substring(0, 100)
    }... Player chose to ${
      dialogue.choices?.[0]?.text || 'continue conversation'
    }`;
    
    return NextResponse.json({
      dialogue,
      npcId: body.npcId,
      npcName: npc.name,
      npcRole: npc.role.job,
      conversationSummary,
      // Include available quests for the UI
      availableQuests: body.context.availableQuests || [],
    });
  } catch (error) {
    console.error('Dialogue generation error:', error);
    
    // Return fallback dialogue with quest options
    const fallbackDialogue = createFallbackDialogue(
      'NPC', 
      [], 
      []
    );
    
    return NextResponse.json({
      dialogue: fallbackDialogue,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Create contextual fallback dialogue
function createFallbackDialogue(
  npcName: string, 
  availableQuests: { questId: string; title: string }[],
  tradeableItems: string[]
) {
  const choices: { text: string; effect?: { type: string; value?: string | number } }[] = [
    { text: "Tell me about yourself", effect: { type: 'relationship', value: 1 } },
  ];
  
  // Add quest option if available
  if (availableQuests.length > 0) {
    choices.push({
      text: `I'd like to help! (Accept: ${availableQuests[0].title})`,
      effect: { type: 'quest_accept', value: availableQuests[0].questId }
    });
  }
  
  // Add trade option if available
  if (tradeableItems.length > 0) {
    choices.push({
      text: "What do you have for trade?",
      effect: { type: 'trade' }
    });
  }
  
  choices.push({ text: "Goodbye!", effect: { type: 'farewell' } });
  
  return {
    speaker: npcName,
    text: "Hello there! Welcome to our village. It's always nice to see a new face around here. Is there something I can help you with?",
    emotion: 'happy',
    choices,
    tags: ['greeting'],
  };
}
