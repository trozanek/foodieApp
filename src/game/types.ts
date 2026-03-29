// Core game types for Kwak - a Quake-inspired 2D platformer

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Sprite {
  width: number;
  height: number;
  pixels: string[][]; // 2D array of hex color strings, '' for transparent
}

export interface AnimationFrame {
  sprite: Sprite;
  duration: number; // ms
}

export interface Animation {
  frames: AnimationFrame[];
  loop: boolean;
}

export type Direction = 'left' | 'right';

export type PlayerState = 'idle' | 'running' | 'jumping' | 'falling' | 'shooting';

export type EnemyType = 'demon' | 'knight' | 'fiend';

export type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';

export type GunType = 'blaster' | 'shotgun' | 'railgun' | 'plasma' | 'rocket' | 'lightning';

export interface Gun {
  type: GunType;
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  projectileSpeed: number;
  projectileColor: string;
  spread: number; // angle in radians
  projectilesPerShot: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  width: number;
  height: number;
  fromPlayer: boolean;
  lifetime: number;
  maxLifetime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  gravity: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'stairs' | 'jumppad';
  jumpForce?: number; // for jump pads
  stairDirection?: Direction; // for stairs
}

export interface LevelData {
  width: number;
  height: number;
  platforms: Platform[];
  spawnPoint: Vec2;
  enemySpawns: EnemySpawn[];
  decorations: Decoration[];
}

export interface EnemySpawn {
  x: number;
  y: number;
  type: EnemyType;
  patrolRange: number;
}

export interface Decoration {
  x: number;
  y: number;
  type: 'pillar' | 'window' | 'torch' | 'banner' | 'arch' | 'cross';
  width: number;
  height: number;
}

export interface Camera {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  shakeAmount: number;
  shakeTimer: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  shoot: boolean;
  switchWeapon: boolean;
}

export interface GameState {
  running: boolean;
  score: number;
  time: number;
  enemiesKilled: number;
}
