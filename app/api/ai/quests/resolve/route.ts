import { NextResponse } from 'next/server';
import { gateway } from '@ai-sdk/gateway';
import { generateObject } from 'ai';
import { questResolutionSchema } from '@/lib/ai/schemas';
import { QUEST_RESOLUTION_PROMPT, buildQuestResolutionPrompt } from '@/lib/ai/prompts';
import { db } from '@/lib/db/client';
import { worlds, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Quest Resolution API
// ============================================

export const maxDuration = 30;

interface QuestResolutionRequest {
  worldId: string;
  questId: string;
  playerActionSummary: string;
  saveId?: string;
}

export async function POST(request: Request) {
  try {
    const body: QuestResolutionRequest = await request.json();
    
    if (!body.worldId || !body.questId || !body.playerActionSummary) {
      return NextResponse.json(
        { error: 'worldId, questId, and playerActionSummary are required' },
        { status: 400 }
      );
    }
    
    // Get the world and find the quest
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
    
    // Find the quest in questArcs
    let foundQuest = null;
    let foundArc = null;
    
    for (const arc of worldData.questArcs) {
      for (const chapter of arc.chapters) {
        if (chapter.questId === body.questId) {
          foundQuest = chapter;
          foundArc = arc;
          break;
        }
      }
      if (foundQuest) break;
    }
    
    if (!foundQuest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }
    
    // Build the prompt
    const prompt = buildQuestResolutionPrompt(
      body.questId,
      foundQuest.objectives,
      body.playerActionSummary
    );
    
    // Generate resolution
    const { object: resolution } = await generateObject({
      model: gateway('openai/gpt-4o-mini'),
      schema: questResolutionSchema,
      system: QUEST_RESOLUTION_PROMPT,
      prompt,
      temperature: 0.3,
    });
    
    // Log the event
    await db.insert(events).values({
      worldId: body.worldId,
      saveId: body.saveId,
      eventType: 'quest_resolution',
      payloadJson: JSON.stringify({
        questId: body.questId,
        action: body.playerActionSummary,
        resolution,
      }),
    });
    
    return NextResponse.json({
      resolution,
      quest: {
        questId: foundQuest.questId,
        title: foundQuest.title,
        arcId: foundArc.arcId,
        arcTitle: foundArc.title,
      },
    });
  } catch (error) {
    console.error('Quest resolution error:', error);
    
    // Return simple success for development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        resolution: {
          questId: 'unknown',
          success: true,
          message: "Great job! You've made progress on your quest.",
          stateUpdates: [],
        },
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to resolve quest' },
      { status: 500 }
    );
  }
}

