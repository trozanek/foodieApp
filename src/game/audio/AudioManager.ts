// Synthwave-style audio using Web Audio API
// Generates procedural sounds - no external audio files needed

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicPlaying: boolean = false;
  private musicNodes: AudioNode[] = [];
  private hihatInterval: ReturnType<typeof setInterval> | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMasterGain(): GainNode {
    this.getContext();
    return this.masterGain!;
  }

  // Blaster/laser shoot sound
  playShoot(): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.getMasterGain());
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (_) {
      // Audio not available
    }
  }

  // Enemy hit sound
  playHit(): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.getMasterGain());
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (_) {
      // Audio not available
    }
  }

  // Enemy death explosion
  playExplosion(): void {
    try {
      const ctx = this.getContext();

      // Noise burst
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.getMasterGain());
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.2);

      // Low thud
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
      oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(oscGain);
      oscGain.connect(this.getMasterGain());
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {
      // Audio not available
    }
  }

  // Jump pad bounce
  playJumpPad(): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.getMasterGain());
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {
      // Audio not available
    }
  }

  // Player hurt
  playPlayerHurt(): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.getMasterGain());
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) {
      // Audio not available
    }
  }

  // Weapon pickup
  playPickup(): void {
    try {
      const ctx = this.getContext();

      const notes = [400, 500, 600, 800];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(this.getMasterGain());
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.1);
      });
    } catch (_) {
      // Audio not available
    }
  }

  // Synthwave metal background music - procedural
  startMusic(): void {
    if (this.musicPlaying) return;

    try {
      const ctx = this.getContext();
      this.musicPlaying = true;

      // Bass line - heavy synthwave bass
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      const bassFilter = ctx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = 55; // A1

      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 200;
      bassFilter.Q.value = 5;

      bassGain.gain.value = 0.08;

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.getMasterGain());
      bassOsc.start();

      // Modulate bass frequency for rhythm
      const bassLFO = ctx.createOscillator();
      const bassLFOGain = ctx.createGain();
      bassLFO.frequency.value = 2; // 2Hz = 120 BPM feel
      bassLFOGain.gain.value = 20;
      bassLFO.connect(bassLFOGain);
      bassLFOGain.connect(bassOsc.frequency);
      bassLFO.start();

      // Pad - atmospheric synth
      const padOsc1 = ctx.createOscillator();
      const padOsc2 = ctx.createOscillator();
      const padGain = ctx.createGain();
      const padFilter = ctx.createBiquadFilter();

      padOsc1.type = 'sine';
      padOsc1.frequency.value = 220; // A3
      padOsc2.type = 'sine';
      padOsc2.frequency.value = 330; // E4 (fifth)

      padFilter.type = 'lowpass';
      padFilter.frequency.value = 800;

      padGain.gain.value = 0.03;

      padOsc1.connect(padFilter);
      padOsc2.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(this.getMasterGain());
      padOsc1.start();
      padOsc2.start();

      // Slow filter sweep on pad
      const padLFO = ctx.createOscillator();
      const padLFOGain = ctx.createGain();
      padLFO.frequency.value = 0.1;
      padLFOGain.gain.value = 400;
      padLFO.connect(padLFOGain);
      padLFOGain.connect(padFilter.frequency);
      padLFO.start();

      // Hi-hat rhythm
      const hihatInterval = setInterval(() => {
        if (!this.musicPlaying) return;
        try {
          const bufferSize = ctx.sampleRate * 0.03;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const hihatGain = ctx.createGain();
          hihatGain.gain.setValueAtTime(0.04, ctx.currentTime);
          hihatGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

          const hihatFilter = ctx.createBiquadFilter();
          hihatFilter.type = 'highpass';
          hihatFilter.frequency.value = 8000;

          noise.connect(hihatFilter);
          hihatFilter.connect(hihatGain);
          hihatGain.connect(this.getMasterGain());
          noise.start();
          noise.stop(ctx.currentTime + 0.03);
        } catch (_) {
          // Ignore
        }
      }, 250); // 16th notes at 120 BPM

      this.musicNodes = [bassOsc, bassLFO, padOsc1, padOsc2, padLFO];
      this.hihatInterval = hihatInterval;
    } catch (_) {
      this.musicPlaying = false;
    }
  }

  stopMusic(): void {
    this.musicPlaying = false;
    this.musicNodes.forEach(node => {
      try {
        if (node instanceof OscillatorNode) {
          node.stop();
        }
      } catch (_) {
        // Already stopped
      }
    });
    this.musicNodes = [];

    if (this.hihatInterval) {
      clearInterval(this.hihatInterval);
      this.hihatInterval = null;
    }
  }

  destroy(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
