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

// ---- PLAYER SPRITES ----
// Quake Ranger style: brown/gold armor, orange pants, bulky build
const playerPalette: Record<string, string> = {
  'H': '#5a3a1a', // helmet dark
  'h': '#7a5a2a', // helmet light
  'F': '#d4a574', // face/skin
  'A': '#8a6a20', // armor gold
  'a': '#6a4a10', // armor dark
  'B': '#4a3a2a', // armor brown
  'b': '#3a2a1a', // armor dark brown
  'P': '#cc5500', // pants orange
  'p': '#aa3300', // pants dark
  'K': '#5a3a1a', // boots
  'k': '#3a2a1a', // boots dark
  'G': '#888888', // gun metal
  'g': '#666666', // gun dark
};

export const PLAYER_IDLE_RIGHT: Sprite = createSprite([
  '...HHH...',
  '..HhhhH..',
  '..FFFFF..',
  '..FFFFF..',
  '.aAAAAa..',
  '.BAAAAB..',
  '.bAAAAb..',
  '..aAAa...',
  '..PPPP...',
  '..PPPP...',
  '..pPPp...',
  '..pPPp...',
  '..KKKK...',
  '..kkkk...',
], playerPalette);

export const PLAYER_IDLE_LEFT: Sprite = createSprite([
  '...HHH...',
  '..HhhhH..',
  '..FFFFF..',
  '..FFFFF..',
  '..aAAAAa.',
  '..BAAAAB.',
  '..bAAAAb.',
  '...aAAa..',
  '...PPPP..',
  '...PPPP..',
  '...pPPp..',
  '...pPPp..',
  '...KKKK..',
  '...kkkk..',
], playerPalette);

export const PLAYER_RUN_RIGHT_1: Sprite = createSprite([
  '...HHH...',
  '..HhhhH..',
  '..FFFFF..',
  '..FFFFF..',
  '.aAAAAaG.',
  '.BAAAABG.',
  '.bAAAAb..',
  '..aAAa...',
  '..PPpP...',
  '..Pp.Pp..',
  '..P...P..',
  '..K...K..',
  '..k...k..',
  '.........',
], playerPalette);

export const PLAYER_RUN_RIGHT_2: Sprite = createSprite([
  '...HHH...',
  '..HhhhH..',
  '..FFFFF..',
  '..FFFFF..',
  '.aAAAAaG.',
  '.BAAAABG.',
  '.bAAAAb..',
  '..aAAa...',
  '...PPP...',
  '..pP.Pp..',
  '.P....P..',
  '.K....K..',
  '.k....k..',
  '.........',
], playerPalette);

export const PLAYER_JUMP_RIGHT: Sprite = createSprite([
  '...HHH...',
  '..HhhhH..',
  '..FFFFF..',
  '..FFFFF..',
  '.aAAAAaG.',
  '.BAAAABG.',
  '.bAAAAb..',
  '..aAAa...',
  '..PPPP...',
  '..pPPp...',
  '..P..P...',
  '..K..K...',
  '.........',
  '.........',
], playerPalette);

// ---- ENEMY SPRITES ----

// Demon - red/dark creature
const demonPalette: Record<string, string> = {
  'R': '#cc0000', // red
  'r': '#880000', // dark red
  'D': '#440000', // very dark red
  'E': '#ffcc00', // eyes yellow
  'H': '#660022', // horns
  'C': '#331111', // claws
};

export const DEMON_SPRITE: Sprite = createSprite([
  '.H...H.',
  '.HR.RH.',
  '..RRR..',
  '.ERERR.',
  '.RRRRR.',
  '.rRRRr.',
  '.rRRRr.',
  '..rRr..',
  '.rR.Rr.',
  '.C...C.',
], demonPalette);

// Knight - armored undead
const knightPalette: Record<string, string> = {
  'S': '#aaaaaa', // steel
  's': '#777777', // dark steel
  'H': '#555555', // helmet
  'E': '#ff3300', // eyes
  'C': '#333333', // chain
  'P': '#444444', // pants
  'W': '#cccccc', // weapon
};

export const KNIGHT_SPRITE: Sprite = createSprite([
  '..HHH..',
  '.HHHHH.',
  '.HEHEH.',
  '.sSSSSW',
  '.CSSSC.',
  '.CSSSC.',
  '..SSS..',
  '..PPP..',
  '.PP.PP.',
  '.ss.ss.',
], knightPalette);

// Fiend - jumping beast
const fiendPalette: Record<string, string> = {
  'B': '#553300', // brown body
  'b': '#332200', // dark body
  'E': '#ff0000', // eyes
  'T': '#ffcccc', // teeth
  'C': '#cc9900', // claws
};

export const FIEND_SPRITE: Sprite = createSprite([
  '..bBBb..',
  '.bBBBBb.',
  '.BEEBBB.',
  '.BTTTTB.',
  '.bBBBBb.',
  '..BBBB..',
  '.bBBBBb.',
  'CB.BB.BC',
  'C..BB..C',
  '...CC...',
], fiendPalette);

// ---- DECORATION SPRITES ----

const torchPalette: Record<string, string> = {
  'F': '#ff6600', // flame
  'f': '#ffaa00', // flame bright
  'Y': '#ffff00', // yellow core
  'W': '#8a6a3a', // wood
  'w': '#6a4a2a', // dark wood
};

export const TORCH_SPRITE: Sprite = createSprite([
  '..fF..',
  '.fYFf.',
  '.FYFF.',
  '..Ff..',
  '..WW..',
  '..WW..',
  '..WW..',
  '..ww..',
], torchPalette);

// ---- GUN PICKUP SPRITES ----

const gunPickupPalette: Record<string, string> = {
  'G': '#888888',
  'g': '#666666',
  'Y': '#ffaa00',
  'R': '#cc0000',
  'B': '#0088cc',
  'L': '#00cc00',
  'P': '#cc00cc',
  'O': '#ff6600',
};

export const GUN_SPRITES: Record<string, Sprite> = {
  blaster: createSprite([
    '..YYY',
    '.gGGY',
    'gGGGg',
    '.gGg.',
  ], gunPickupPalette),
  shotgun: createSprite([
    '....RR',
    '.gGGRR',
    'gGGGGg',
    '.gggg.',
  ], gunPickupPalette),
  railgun: createSprite([
    '...BBB',
    '.gGBBB',
    'gGGGGg',
    '.gggg.',
  ], gunPickupPalette),
  plasma: createSprite([
    '..BBB.',
    '.gGBBB',
    'gGGGGg',
    '.gggg.',
  ], gunPickupPalette),
  rocket: createSprite([
    '....OO',
    '.gGGOO',
    'gGGGGg',
    '.gggg.',
  ], gunPickupPalette),
  lightning: createSprite([
    '..PPP.',
    '.gGPPP',
    'gGGGGg',
    '.gggg.',
  ], gunPickupPalette),
};

// Jump pad sprite
const jumpPadPalette: Record<string, string> = {
  'M': '#666666', // metal
  'm': '#444444', // dark metal
  'G': '#00ff88', // glow green
  'g': '#00aa55', // glow dark
};

export const JUMPPAD_SPRITE: Sprite = createSprite([
  'GGGGGGGG',
  'gGGGGGGg',
  'mMMMMMmm',
  'mMMMMMMm',
], jumpPadPalette);
