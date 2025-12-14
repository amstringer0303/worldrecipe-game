'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import type { ItemStack } from '@/types/game';

// ============================================
// Inventory Slot Component
// ============================================

interface InventorySlotProps {
  stack?: ItemStack;
  index: number;
}

function InventorySlot({ stack, index }: InventorySlotProps) {
  const rarityColors: Record<string, string> = {
    common: 'border-muted',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    legendary: 'border-yellow-500',
  };
  
  const categoryIcons: Record<string, string> = {
    ingredient: '🥬',
    tool: '🔧',
    souvenir: '🎁',
    clothing: '👕',
    decor: '🎨',
  };
  
  if (!stack) {
    return (
      <div className="aspect-square border-2 border-dashed border-muted/30 rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground/30 text-xs">{index + 1}</span>
      </div>
    );
  }
  
  const { item, quantity } = stack;
  
  return (
    <div 
      className={`
        aspect-square border-2 rounded-lg p-2 
        ${rarityColors[item.rarity]} 
        bg-muted/30 hover:bg-muted/50 
        cursor-pointer transition-all
        flex flex-col items-center justify-center
        relative
      `}
      title={`${item.name}\n${item.description}`}
    >
      <span className="text-2xl">
        {item.icon || categoryIcons[item.category] || '📦'}
      </span>
      <span className="text-xs font-medium truncate w-full text-center mt-1">
        {item.name}
      </span>
      {quantity > 1 && (
        <Badge 
          variant="secondary" 
          className="absolute -bottom-1 -right-1 text-xs px-1.5 py-0"
        >
          {quantity}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// Main Inventory Panel
// ============================================

export function InventoryPanel() {
  const showInventory = useGameStore((s) => s.showInventory);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const inventory = usePlayerStore((s) => s.inventory);
  const maxSlots = usePlayerStore((s) => s.maxInventorySlots);
  
  if (!showInventory) return null;
  
  // Create array with empty slots
  const slots = Array(maxSlots).fill(null).map((_, i) => inventory[i] || null);
  
  // Calculate totals
  const totalItems = inventory.reduce((sum, stack) => sum + stack.quantity, 0);
  const usedSlots = inventory.length;
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-lg bg-card/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <span>🎒</span>
            Inventory
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {usedSlots}/{maxSlots} slots • {totalItems} items
            </span>
            <Button variant="ghost" size="sm" onClick={toggleInventory}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {slots.map((stack, index) => (
              <InventorySlot key={index} stack={stack || undefined} index={index} />
            ))}
          </div>
          
          {/* Category legend */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Rarity</p>
            <div className="flex gap-3">
              <span className="text-xs flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-muted rounded" />
                Common
              </span>
              <span className="text-xs flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-green-500 rounded" />
                Uncommon
              </span>
              <span className="text-xs flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-blue-500 rounded" />
                Rare
              </span>
              <span className="text-xs flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-yellow-500 rounded" />
                Legendary
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InventoryPanel;

