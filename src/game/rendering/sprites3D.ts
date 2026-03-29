import { Sprite } from '../types';

// Helper to create sprite from compact string representation
// Each character maps to a color, '.' is transparent
function createSprite(rows: string[], palette: Record<string, string>): Sprite {
  const pixels = rows.map(row =>
    row.split('').map(ch => (ch === '.' ? '' : palette[ch] || ''))
  );
  return {
    width: pixels[0]?.length || 0,
    height: pixels.length,
    pixels,
  };
}

// ---- PLAYER SPRITES (3D version - bigger, more detailed) ----
// Quake Ranger style: brown/gold armor, orange pants, bulky build
// 16x20 pixels (was 9x14) - rendered at 4x scale = 64x80 pixels
const playerPalette: Record<string, string> = {
  'H': '#5a3a1a', // helmet dark
  'h': '#7a5a2a', // helmet light
  'V': '#8a6a30', // helmet visor
  'F': '#d4a574', // face/skin
  'f': '#b88a5a', // face shadow
  'A': '#8a6a20', // armor gold
  'a': '#6a4a10', // armor dark
  'B': '#4a3a2a', // armor brown
  'b': '#3a2a1a', // armor dark brown
  'S': '#9a7a30', // shoulder pad
  's': '#7a5a18', // shoulder dark
  'P': '#cc5500', // pants orange
  'p': '#aa3300', // pants dark
  'K': '#5a3a1a', // boots
  'k': '#3a2a1a', // boots dark
  'G': '#888888', // gun metal
  'g': '#666666', // gun dark
  'L': '#555555', // gun detail
  'E': '#44aa44', // visor glow
};

export const PLAYER_IDLE_RIGHT_3D: Sprite = createSprite([
  '....HHHHHH......',
  '...HHhhhhhH.....',
  '...HhVVVVhH.....',
  '...HhEEEEhH.....',
  '....FFFFfF......',
  '....FFFFfF......',
  '...sSSAAAASs....',
  '..sBBAAAABBs....',
  '..bBBAAAABBb....',
  '..bBBAAAABBb....',
  '...bAAaAAab.....',
  '...bAAaAAab.....',
  '....aAAAAa......',
  '....PPPPPP......',
  '....PPPPPP......',
  '....pPPPPp......',
  '....pPPPPp......',
  '....KKKKKK......',
  '....kKKKKk......',
  '....kkkkkk......',
], playerPalette);

export const PLAYER_IDLE_LEFT_3D: Sprite = createSprite([
  '......HHHHHH....',
  '.....HhhhhhH....',
  '.....HhVVVVhH...',
  '.....HhEEEEhH...',
  '......FfFFFF....',
  '......FfFFFF....',
  '....sSAAAASSs...',
  '....sBBAAAABBs..',
  '....bBBAAAABBb..',
  '....bBBAAAABBb..',
  '.....bAAaAAab...',
  '.....bAAaAAab...',
  '......aAAAAa....',
  '......PPPPPP....',
  '......PPPPPP....',
  '......pPPPPp....',
  '......pPPPPp....',
  '......KKKKKK....',
  '......kKKKKk....',
  '......kkkkkk....',
], playerPalette);

export const PLAYER_RUN_RIGHT_1_3D: Sprite = createSprite([
  '....HHHHHH......',
  '...HHhhhhhH.....',
  '...HhVVVVhH.....',
  '...HhEEEEhH.....',
  '....FFFFfF......',
  '....FFFFfF......',
  '..sSSAAAASsGG...',
  '..sBBAAAABBGGL..',
  '..bBBAAAABBb....',
  '..bBBAAAABBb....',
  '...bAAaAAab.....',
  '....aAAAAa......',
  '....PPppPP......',
  '....Pp..pP......',
  '...PP....PP.....',
  '...P......P.....',
  '...K......K.....',
  '...kk....kk.....',
  '................',
  '................',
], playerPalette);

export const PLAYER_RUN_RIGHT_2_3D: Sprite = createSprite([
  '....HHHHHH......',
  '...HHhhhhhH.....',
  '...HhVVVVhH.....',
  '...HhEEEEhH.....',
  '....FFFFfF......',
  '....FFFFfF......',
  '..sSSAAAASsGG...',
  '..sBBAAAABBGGL..',
  '..bBBAAAABBb....',
  '..bBBAAAABBb....',
  '...bAAaAAab.....',
  '....aAAAAa......',
  '.....PPPP.......',
  '....pP..Pp......',
  '...P......P.....',
  '..P........P....',
  '..K........K....',
  '..kk......kk...',
  '................',
  '................',
], playerPalette);

export const PLAYER_JUMP_RIGHT_3D: Sprite = createSprite([
  '....HHHHHH......',
  '...HHhhhhhH.....',
  '...HhVVVVhH.....',
  '...HhEEEEhH.....',
  '....FFFFfF......',
  '....FFFFfF......',
  '..sSSAAAASsGG...',
  '..sBBAAAABBGGL..',
  '..bBBAAAABBb....',
  '..bBBAAAABBb....',
  '...bAAaAAab.....',
  '....aAAAAa......',
  '....PPPPPP......',
  '....pPPPPp......',
  '....PP..PP......',
  '....K....K......',
  '....kk..kk......',
  '................',
  '................',
  '................',
], playerPalette);

// ---- ENEMY SPRITES (3D version - bigger, more detailed) ----

// Demon - 12x16 pixels (was 7x10)
const demonPalette: Record<string, string> = {
  'R': '#cc0000',
  'r': '#880000',
  'D': '#440000',
  'E': '#ffcc00',
  'e': '#ff8800',
  'H': '#660022',
  'h': '#440011',
  'C': '#331111',
  'M': '#aa0000', // mouth
  'T': '#ff4444', // teeth
  'W': '#550000', // wing
};

export const DEMON_SPRITE_3D: Sprite = createSprite([
  '..H......H..',
  '.HH......HH.',
  '.HHR....RHH.',
  '..RRR..RRR..',
  '..RRRRRRRR..',
  '.RERERRERR..',
  '.RReeRReeRR.',
  '.RRRRRRRRRR.',
  '.RRMTTTTMRR.',
  '..rRRRRRRr..',
  '..rRRRRRRr..',
  '..rrRRRRrr..',
  '...rR..Rr...',
  '..rR....Rr..',
  '..C......C..',
  '..CC....CC..',
], demonPalette);

// Knight - 12x16 pixels (was 7x10)
const knightPalette: Record<string, string> = {
  'S': '#aaaaaa',
  's': '#777777',
  'H': '#555555',
  'h': '#444444',
  'E': '#ff3300',
  'e': '#cc2200',
  'C': '#333333',
  'P': '#444444',
  'p': '#333333',
  'W': '#cccccc',
  'w': '#999999',
  'B': '#666666', // belt
};

export const KNIGHT_SPRITE_3D: Sprite = createSprite([
  '....HHHH....',
  '...HHHHHH...',
  '..HHhhhHHH..',
  '..HHEhHEHH..',
  '..HHhhhHHH..',
  '...sSSSSSWW.',
  '..sSSSSSSWW.',
  '..CSSSSSSC..',
  '..CSSSSSC...',
  '...BBBBBB...',
  '...SSSSSS...',
  '...sPPPPs...',
  '..PP..PP....',
  '..PP..PP....',
  '..ss..ss....',
  '..ss..ss....',
], knightPalette);

// Fiend - 14x16 pixels (was 8x10)
const fiendPalette: Record<string, string> = {
  'B': '#553300',
  'b': '#332200',
  'D': '#221100',
  'E': '#ff0000',
  'e': '#cc0000',
  'T': '#ffcccc',
  't': '#ff9999',
  'C': '#cc9900',
  'c': '#996600',
  'M': '#443300', // mane
};

export const FIEND_SPRITE_3D: Sprite = createSprite([
  '...MbbBBbbM...',
  '..MbBBBBBBbM..',
  '..bBBBBBBBBb..',
  '.bBBEEBBEEBBb.',
  '.bBBeeBBeBBBb.',
  '.bBBTTTTTTBBb.',
  '.bBBtTTTTtBBb.',
  '..bBBBBBBBBb..',
  '...bBBBBBBb...',
  '..bBBBBBBBBb..',
  '.bBB.BBBB.BBb.',
  'CB...BBBB...BC',
  'CC..bBBBb...CC',
  '.....BBBB.....',
  '.....cCCc.....',
  '......CC......',
], fiendPalette);

// ---- DECORATION SPRITES ----

const torchPalette: Record<string, string> = {
  'F': '#ff6600',
  'f': '#ffaa00',
  'Y': '#ffff00',
  'W': '#8a6a3a',
  'w': '#6a4a2a',
};

export const TORCH_SPRITE_3D: Sprite = createSprite([
  '..fF..',
  '.fYFf.',
  '.FYFF.',
  '..Ff..',
  '..WW..',
  '..WW..',
  '..WW..',
  '..ww..',
], torchPalette);
