import { InputState } from '../types';

export class Input {
  private keys: Set<string> = new Set();
  private previousKeys: Set<string> = new Set();
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
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

  getState(): InputState {
    return {
      left: this.keys.has('ArrowLeft') || this.keys.has('KeyA'),
      right: this.keys.has('ArrowRight') || this.keys.has('KeyD'),
      up: this.keys.has('ArrowUp') || this.keys.has('KeyW'),
      down: this.keys.has('ArrowDown') || this.keys.has('KeyS'),
      jump: this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW'),
      shoot: this.keys.has('KeyX') || this.keys.has('Slash'),
      switchWeapon: this.isJustPressed('KeyQ'),
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
  }
}
