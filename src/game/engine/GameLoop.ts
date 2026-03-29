export type UpdateFn = (dt: number) => void;
export type RenderFn = () => void;

export class GameLoop {
  private updateFn: UpdateFn;
  private renderFn: RenderFn;
  private lastTime: number = 0;
  private animFrameId: number = 0;
  private running: boolean = false;
  private readonly fixedDt: number = 1000 / 60; // 60fps fixed step
  private accumulator: number = 0;

  constructor(updateFn: UpdateFn, renderFn: RenderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tick(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return;

    let frameTime = now - this.lastTime;
    this.lastTime = now;

    // Cap frame time to prevent spiral of death
    if (frameTime > 250) {
      frameTime = 250;
    }

    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedDt) {
      this.updateFn(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    this.renderFn();

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  isRunning(): boolean {
    return this.running;
  }
}
