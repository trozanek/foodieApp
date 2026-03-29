import { InputState } from '../types';

export class Input {
  private keys: Set<string> = new Set();
  private previousKeys: Set<string> = new Set();
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundContextMenu: (e: MouseEvent) => void;

  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDown: boolean = false;
  private rightMouseDown: boolean = false;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundContextMenu = this.handleContextMenu.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('contextmenu', this.boundContextMenu);
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code);
    // Prevent default for game keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ'].includes(e.code)) {
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.mouseDown = true;
    } else if (e.button === 2) {
      this.rightMouseDown = true;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.mouseDown = false;
    } else if (e.button === 2) {
      this.rightMouseDown = false;
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
  }

  getState(): InputState {
    return {
      left: this.keys.has('ArrowLeft') || this.keys.has('KeyA'),
      right: this.keys.has('ArrowRight') || this.keys.has('KeyD'),
      up: this.keys.has('ArrowUp') || this.keys.has('KeyW'),
      down: this.keys.has('ArrowDown') || this.keys.has('KeyS'),
      jump: this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW'),
      shoot: this.keys.has('KeyX') || this.keys.has('Slash') || this.mouseDown,
      switchWeapon: this.isJustPressed('KeyQ'),
      mouseX: this.mouseX,
      mouseY: this.mouseY,
      mouseDown: this.mouseDown,
      rightMouseDown: this.rightMouseDown,
      aimAngle: 0, // Calculated in Game.ts using player position and camera
    };
  }

  private isJustPressed(code: string): boolean {
    return this.keys.has(code) && !this.previousKeys.has(code);
  }

  update(): void {
    this.previousKeys = new Set(this.keys);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('contextmenu', this.boundContextMenu);
  }
}
