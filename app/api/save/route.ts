import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/client';
import { saves, worlds } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// Save Game API
// ============================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      saveId,
      worldId,
      slotNumber = 1,
      playerName = 'Chef',
      currentRegionId,
      playerPosition,
      dayNumber,
      timeOfDay,
      playTimeSeconds,
      inventory,
      completedQuests,
      activeQuests,
      npcRelationships,
      completedCookingSteps,
    } = body;
    
    // Verify world exists
    const world = await db.query.worlds.findFirst({
      where: eq(worlds.worldId, worldId),
    });
    
    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }
    
    const newSaveId = saveId || uuidv4();
    const now = new Date();
    
    // Check if save exists (update) or create new
    const existingSave = saveId 
      ? await db.query.saves.findFirst({ where: eq(saves.saveId, saveId) })
      : null;
    
    if (existingSave) {
      // Update existing save
      await db.update(saves)
        .set({
          currentRegionId,
          playerPositionX: Math.round(playerPosition[0] * 100),
          playerPositionY: Math.round(playerPosition[1] * 100),
          playerPositionZ: Math.round(playerPosition[2] * 100),
          dayNumber,
          timeOfDay,
          playTimeSeconds: Math.round(playTimeSeconds),
          inventoryJson: JSON.stringify(inventory),
          completedQuestsJson: JSON.stringify(completedQuests),
          activeQuestsJson: JSON.stringify(activeQuests),
          npcRelationshipsJson: JSON.stringify(npcRelationships),
          completedCookingStepsJson: JSON.stringify(completedCookingSteps),
          updatedAt: now,
        })
        .where(eq(saves.saveId, saveId));
      
      return NextResponse.json({
        saveId,
        message: 'Save updated successfully',
      });
    } else {
      // Create new save
      await db.insert(saves).values({
        saveId: newSaveId,
        worldId,
        slotNumber,
        playerName,
        currentRegionId,
        playerPositionX: Math.round(playerPosition[0] * 100),
        playerPositionY: Math.round(playerPosition[1] * 100),
        playerPositionZ: Math.round(playerPosition[2] * 100),
        dayNumber,
        timeOfDay,
        playTimeSeconds: Math.round(playTimeSeconds),
        inventoryJson: JSON.stringify(inventory),
        completedQuestsJson: JSON.stringify(completedQuests),
        activeQuestsJson: JSON.stringify(activeQuests),
        npcRelationshipsJson: JSON.stringify(npcRelationships),
        completedCookingStepsJson: JSON.stringify(completedCookingSteps),
      });
      
      return NextResponse.json({
        saveId: newSaveId,
        message: 'Save created successfully',
      });
    }
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Failed to save game' },
      { status: 500 }
    );
  }
}

// ============================================
// Load Save API
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const saveId = searchParams.get('saveId');
    const worldId = searchParams.get('worldId');
    
    if (saveId) {
      // Load specific save
      const save = await db.query.saves.findFirst({
        where: eq(saves.saveId, saveId),
      });
      
      if (!save) {
        return NextResponse.json(
          { error: 'Save not found' },
          { status: 404 }
        );
      }
      
      // Get the associated world
      const world = await db.query.worlds.findFirst({
        where: eq(worlds.worldId, save.worldId),
      });
      
      return NextResponse.json({
        save: {
          ...save,
          playerPosition: [
            save.playerPositionX / 100,
            save.playerPositionY / 100,
            save.playerPositionZ / 100,
          ],
          inventory: JSON.parse(save.inventoryJson),
          completedQuests: JSON.parse(save.completedQuestsJson),
          activeQuests: JSON.parse(save.activeQuestsJson),
          npcRelationships: JSON.parse(save.npcRelationshipsJson),
          completedCookingSteps: JSON.parse(save.completedCookingStepsJson),
        },
        world: world ? JSON.parse(world.worldJson) : null,
      });
    }
    
    if (worldId) {
      // List saves for a world
      const worldSaves = await db.query.saves.findMany({
        where: eq(saves.worldId, worldId),
        orderBy: (saves, { desc }) => [desc(saves.updatedAt)],
      });
      
      return NextResponse.json({
        saves: worldSaves.map((save) => ({
          saveId: save.saveId,
          slotNumber: save.slotNumber,
          playerName: save.playerName,
          dayNumber: save.dayNumber,
          playTimeSeconds: save.playTimeSeconds,
          updatedAt: save.updatedAt,
        })),
      });
    }
    
    // List all recent saves
    const recentSaves = await db.query.saves.findMany({
      orderBy: (saves, { desc }) => [desc(saves.updatedAt)],
      limit: 10,
    });
    
    return NextResponse.json({
      saves: recentSaves.map((save) => ({
        saveId: save.saveId,
        worldId: save.worldId,
        slotNumber: save.slotNumber,
        playerName: save.playerName,
        dayNumber: save.dayNumber,
        playTimeSeconds: save.playTimeSeconds,
        updatedAt: save.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Load error:', error);
    return NextResponse.json(
      { error: 'Failed to load saves' },
      { status: 500 }
    );
  }
}

// ============================================
// Delete Save API
// ============================================

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const saveId = searchParams.get('saveId');
    
    if (!saveId) {
      return NextResponse.json(
        { error: 'saveId is required' },
        { status: 400 }
      );
    }
    
    await db.delete(saves).where(eq(saves.saveId, saveId));
    
    return NextResponse.json({
      message: 'Save deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete save' },
      { status: 500 }
    );
  }
}

