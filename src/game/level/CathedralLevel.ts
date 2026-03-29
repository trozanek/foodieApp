import { LevelData, Decoration } from '../types';

// Cathedral level - dark themed with high windows, pillars, multiple balcony levels
// Layout: ground floor, two balcony levels, with stairs and jump pads to traverse
export function createCathedralLevel(): LevelData {
  const LEVEL_WIDTH = 4800;
  const LEVEL_HEIGHT = 1200;
  const GROUND_Y = 1050;
  const BALCONY_1_Y = 750;
  const BALCONY_2_Y = 450;

  const platforms = [
    // === GROUND FLOOR ===
    // Main ground
    { x: 0, y: GROUND_Y, width: 800, height: 150, type: 'solid' as const },
    { x: 900, y: GROUND_Y, width: 600, height: 150, type: 'solid' as const },
    { x: 1600, y: GROUND_Y, width: 1000, height: 150, type: 'solid' as const },
    { x: 2700, y: GROUND_Y, width: 800, height: 150, type: 'solid' as const },
    { x: 3600, y: GROUND_Y, width: 1200, height: 150, type: 'solid' as const },

    // Small stepping platforms over gaps
    { x: 820, y: GROUND_Y - 30, width: 60, height: 30, type: 'solid' as const },
    { x: 1520, y: GROUND_Y - 30, width: 60, height: 30, type: 'solid' as const },
    { x: 2620, y: GROUND_Y - 30, width: 60, height: 30, type: 'solid' as const },
    { x: 3520, y: GROUND_Y - 30, width: 60, height: 30, type: 'solid' as const },

    // === FIRST BALCONY LEVEL ===
    // Stairs from ground to balcony 1 (left side)
    { x: 100, y: GROUND_Y - 300, width: 200, height: 300, type: 'stairs' as const, stairDirection: 'right' as const },

    // Balcony 1 platforms
    { x: 300, y: BALCONY_1_Y, width: 500, height: 24, type: 'solid' as const },
    { x: 900, y: BALCONY_1_Y, width: 400, height: 24, type: 'solid' as const },
    { x: 1400, y: BALCONY_1_Y - 30, width: 300, height: 24, type: 'solid' as const },
    { x: 1800, y: BALCONY_1_Y, width: 500, height: 24, type: 'solid' as const },
    { x: 2400, y: BALCONY_1_Y + 20, width: 400, height: 24, type: 'solid' as const },
    { x: 2900, y: BALCONY_1_Y, width: 600, height: 24, type: 'solid' as const },
    { x: 3600, y: BALCONY_1_Y - 20, width: 400, height: 24, type: 'solid' as const },
    { x: 4100, y: BALCONY_1_Y, width: 500, height: 24, type: 'solid' as const },

    // Jump pad on ground to reach balcony 1 (mid section)
    { x: 1650, y: GROUND_Y - 16, width: 80, height: 16, type: 'jumppad' as const, jumpForce: 18 },
    { x: 3500, y: GROUND_Y - 16, width: 80, height: 16, type: 'jumppad' as const, jumpForce: 18 },

    // === SECOND BALCONY LEVEL ===
    // Stairs from balcony 1 to balcony 2 (right side)
    { x: 3200, y: BALCONY_2_Y, width: 200, height: 300, type: 'stairs' as const, stairDirection: 'left' as const },

    // Balcony 2 platforms
    { x: 200, y: BALCONY_2_Y, width: 400, height: 24, type: 'solid' as const },
    { x: 700, y: BALCONY_2_Y + 20, width: 350, height: 24, type: 'solid' as const },
    { x: 1150, y: BALCONY_2_Y, width: 400, height: 24, type: 'solid' as const },
    { x: 1650, y: BALCONY_2_Y - 20, width: 300, height: 24, type: 'solid' as const },
    { x: 2050, y: BALCONY_2_Y, width: 500, height: 24, type: 'solid' as const },
    { x: 2650, y: BALCONY_2_Y + 10, width: 350, height: 24, type: 'solid' as const },
    { x: 3500, y: BALCONY_2_Y, width: 500, height: 24, type: 'solid' as const },
    { x: 4100, y: BALCONY_2_Y - 10, width: 400, height: 24, type: 'solid' as const },

    // Jump pads on balcony 1 to reach balcony 2
    { x: 500, y: BALCONY_1_Y - 16, width: 80, height: 16, type: 'jumppad' as const, jumpForce: 16 },
    { x: 2100, y: BALCONY_1_Y - 16, width: 80, height: 16, type: 'jumppad' as const, jumpForce: 16 },

    // === WALLS (left and right boundaries) ===
    { x: -20, y: 0, width: 20, height: LEVEL_HEIGHT, type: 'solid' as const },
    { x: LEVEL_WIDTH, y: 0, width: 20, height: LEVEL_HEIGHT, type: 'solid' as const },
  ];

  // Decorations
  const decorations: Decoration[] = [
    // Pillars on ground floor
    { x: 400, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 700, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 1000, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 1400, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 1800, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 2200, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 2600, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 3000, y: GROUND_Y - 250, type: 'pillar', width: 30, height: 250 },
    { x: 3400, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 3800, y: GROUND_Y - 200, type: 'pillar', width: 30, height: 200 },
    { x: 4200, y: GROUND_Y - 250, type: 'pillar', width: 30, height: 250 },

    // High windows
    { x: 250, y: 150, type: 'window', width: 60, height: 120 },
    { x: 550, y: 100, type: 'window', width: 50, height: 140 },
    { x: 900, y: 150, type: 'window', width: 60, height: 120 },
    { x: 1300, y: 100, type: 'window', width: 60, height: 140 },
    { x: 1700, y: 120, type: 'window', width: 50, height: 130 },
    { x: 2100, y: 150, type: 'window', width: 60, height: 120 },
    { x: 2500, y: 100, type: 'window', width: 60, height: 140 },
    { x: 2900, y: 130, type: 'window', width: 50, height: 120 },
    { x: 3300, y: 100, type: 'window', width: 60, height: 140 },
    { x: 3700, y: 150, type: 'window', width: 60, height: 120 },
    { x: 4100, y: 120, type: 'window', width: 50, height: 130 },

    // Torches along walls
    { x: 150, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 500, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 850, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 1200, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 1600, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 2000, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 2400, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 2800, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 3200, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 3600, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 4000, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },
    { x: 4400, y: GROUND_Y - 100, type: 'torch', width: 12, height: 36 },

    // Arches
    { x: 600, y: BALCONY_1_Y - 150, type: 'arch', width: 120, height: 150 },
    { x: 1900, y: BALCONY_1_Y - 150, type: 'arch', width: 120, height: 150 },
    { x: 3100, y: BALCONY_1_Y - 150, type: 'arch', width: 120, height: 150 },

    // Crosses and banners
    { x: 400, y: 50, type: 'cross', width: 30, height: 60 },
    { x: 1100, y: 40, type: 'cross', width: 35, height: 70 },
    { x: 2300, y: 50, type: 'cross', width: 30, height: 60 },
    { x: 3500, y: 40, type: 'cross', width: 35, height: 70 },
    { x: 4300, y: 50, type: 'cross', width: 30, height: 60 },

    { x: 350, y: BALCONY_2_Y - 80, type: 'banner', width: 24, height: 60 },
    { x: 1300, y: BALCONY_2_Y - 80, type: 'banner', width: 24, height: 60 },
    { x: 2300, y: BALCONY_2_Y - 80, type: 'banner', width: 24, height: 60 },
    { x: 3800, y: BALCONY_2_Y - 80, type: 'banner', width: 24, height: 60 },
  ];

  // Enemy spawns distributed across all levels
  const enemySpawns = [
    // Ground floor enemies (y = GROUND_Y - 74 so enemy bottom is 10px above ground)
    { x: 600, y: GROUND_Y - 74, type: 'demon' as const, patrolRange: 150 },
    { x: 1100, y: GROUND_Y - 74, type: 'knight' as const, patrolRange: 100 },
    { x: 1900, y: GROUND_Y - 74, type: 'demon' as const, patrolRange: 200 },
    { x: 2500, y: GROUND_Y - 74, type: 'fiend' as const, patrolRange: 150 },
    { x: 3000, y: GROUND_Y - 74, type: 'knight' as const, patrolRange: 120 },
    { x: 3900, y: GROUND_Y - 74, type: 'demon' as const, patrolRange: 180 },
    { x: 4400, y: GROUND_Y - 74, type: 'knight' as const, patrolRange: 100 },

    // Balcony 1 enemies
    { x: 500, y: BALCONY_1_Y - 74, type: 'demon' as const, patrolRange: 120 },
    { x: 1000, y: BALCONY_1_Y - 74, type: 'knight' as const, patrolRange: 100 },
    { x: 2000, y: BALCONY_1_Y - 74, type: 'fiend' as const, patrolRange: 150 },
    { x: 3100, y: BALCONY_1_Y - 74, type: 'demon' as const, patrolRange: 130 },
    { x: 4300, y: BALCONY_1_Y - 74, type: 'knight' as const, patrolRange: 100 },

    // Balcony 2 enemies
    { x: 400, y: BALCONY_2_Y - 74, type: 'knight' as const, patrolRange: 100 },
    { x: 1300, y: BALCONY_2_Y - 74, type: 'fiend' as const, patrolRange: 120 },
    { x: 2300, y: BALCONY_2_Y - 74, type: 'demon' as const, patrolRange: 150 },
    { x: 3700, y: BALCONY_2_Y - 74, type: 'knight' as const, patrolRange: 100 },
    { x: 4300, y: BALCONY_2_Y - 74, type: 'demon' as const, patrolRange: 130 },
  ];

  return {
    width: LEVEL_WIDTH,
    height: LEVEL_HEIGHT,
    platforms,
    spawnPoint: { x: 100, y: GROUND_Y - 90 },
    enemySpawns,
    decorations,
  };
}
