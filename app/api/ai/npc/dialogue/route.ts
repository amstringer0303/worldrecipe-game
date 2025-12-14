import { NextResponse } from 'next/server';
import { gateway } from '@ai-sdk/gateway';
import { generateObject } from 'ai';
import { dialogueTurnSchema } from '@/lib/ai/schemas';
import { DIALOGUE_SYSTEM_PROMPT, buildDialoguePrompt } from '@/lib/ai/prompts';
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
    lastTalkSummary?: string;
    currentTimeOfDay: string;
  };
}

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
    const npc = worldData.npcRoster.find((n: any) => n.npcId === body.npcId);
    
    if (!npc) {
      return NextResponse.json(
        { error: 'NPC not found' },
        { status: 404 }
      );
    }
    
    // Build the prompt
    const prompt = buildDialoguePrompt(npc, body.context);
    
    // Generate dialogue
    const { object: dialogue } = await generateObject({
      model: gateway('openai/gpt-4o-mini'),
      schema: dialogueTurnSchema,
      system: DIALOGUE_SYSTEM_PROMPT,
      prompt,
      temperature: 0.8,
    });
    
    // Set the speaker
    dialogue.speaker = npc.name;
    
    return NextResponse.json({
      dialogue,
      npcId: body.npcId,
      npcName: npc.name,
    });
  } catch (error) {
    console.error('Dialogue generation error:', error);
    
    // Return fallback dialogue for development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        dialogue: {
          speaker: 'NPC',
          text: "Hello there! Welcome to our village. I hope you're enjoying your adventure!",
          emotion: 'happy',
          choices: [
            { text: "Tell me about yourself", effect: { type: 'relationship', value: 1 } },
            { text: "Do you have any work for me?", effect: { type: 'quest_accept' } },
            { text: "Goodbye!", effect: { type: 'farewell' } },
          ],
          tags: ['greeting'],
        },
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to generate dialogue' },
      { status: 500 }
    );
  }
}

