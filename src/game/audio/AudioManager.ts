// Dynamic reactive music system - heavy metal in synthwave style
// All music is procedurally generated via Web Audio API
// Tempo and musical elements respond to gameplay events in real time

// E minor pentatonic scale frequencies for metal riffs
const E_MINOR_SCALE = [82.41, 98.0, 110.0, 123.47, 146.83, 164.81, 196.0, 220.0, 246.94, 293.66, 329.63];
// Power chord intervals (root + fifth + octave)
const POWER_CHORD_RATIOS = [1, 1.5, 2];

const MIN_BPM = 80;
const MAX_BPM = 170;
const BPM_LERP_SPEED = 0.03;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicPlaying: boolean = false;

  // Tempo system
  private currentBPM: number = MIN_BPM;
  private targetBPM: number = MIN_BPM;
  private beatInterval: ReturnType<typeof setTimeout> | null = null;
  private beatCount: number = 0;

  // Continuous music nodes
  private bassOsc: OscillatorNode | null = null;
  private bassGain: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private bassLFO: OscillatorNode | null = null;
  private bassLFOGain: GainNode | null = null;
  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;

  // Distortion for guitar sounds
  private distortionCurve: Float32Array | null = null;

  // Bass note sequence (E minor pattern)
  private bassNotes: number[] = [41.2, 41.2, 55.0, 49.0, 41.2, 55.0, 49.0, 36.71];
  private bassNoteIndex: number = 0;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.distortionCurve = this.makeDistortionCurve(400);
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

  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  private getSecondsPerBeat(): number {
    return 60 / this.currentBPM;
  }

  // Update tempo based on player movement speed (call every frame)
  setPlayerSpeed(speed: number): void {
    // speed is absolute velocity magnitude (0 = idle, ~4.5 = running)
    const normalizedSpeed = Math.min(speed / 4.5, 1);
    this.targetBPM = MIN_BPM + (MAX_BPM - MIN_BPM) * normalizedSpeed;
  }

  // Hard distorted guitar riff triggered on gun fire
  playGuitarRiff(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const beatLen = this.getSecondsPerBeat() * 0.25;

      // Pick a random root from the scale
      const root = E_MINOR_SCALE[Math.floor(Math.random() * 5)];
      // Quick 2-3 note power chord stab
      const noteCount = 2 + Math.floor(Math.random() * 2);

      for (let n = 0; n < noteCount; n++) {
        const startTime = now + n * beatLen * 0.5;
        const noteRoot = n === 0 ? root : E_MINOR_SCALE[Math.floor(Math.random() * E_MINOR_SCALE.length)];

        for (const ratio of POWER_CHORD_RATIOS) {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          const distortion = ctx.createWaveShaper();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(noteRoot * ratio, startTime);

          distortion.curve = this.distortionCurve;
          distortion.oversample = '4x';

          const noteLen = beatLen * 0.8;
          oscGain.gain.setValueAtTime(0, startTime);
          oscGain.gain.linearRampToValueAtTime(0.06, startTime + 0.005);
          oscGain.gain.setValueAtTime(0.06, startTime + noteLen * 0.6);
          oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLen);

          osc.connect(distortion);
          distortion.connect(oscGain);
          oscGain.connect(this.getMasterGain());
          osc.start(startTime);
          osc.stop(startTime + noteLen + 0.01);
        }
      }
    } catch (_) {
      // Audio not available
    }
  }

  // Heavy drum hit triggered on jump
  playDrumHit(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Kick drum - low sine with pitch drop
      const kick = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(150, now);
      kick.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      kickGain.gain.setValueAtTime(0.35, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      kick.connect(kickGain);
      kickGain.connect(this.getMasterGain());
      kick.start(now);
      kick.stop(now + 0.25);

      // Snare layer - noise burst with body
      const bufferSize = Math.floor(ctx.sampleRate * 0.1);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.8;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 3000;
      noiseFilter.Q.value = 1;

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.getMasterGain());
      noise.start(now);
      noise.stop(now + 0.1);

      // Tonal snare body
      const snareBody = ctx.createOscillator();
      const snareBodyGain = ctx.createGain();
      snareBody.type = 'triangle';
      snareBody.frequency.setValueAtTime(200, now);
      snareBody.frequency.exponentialRampToValueAtTime(120, now + 0.05);
      snareBodyGain.gain.setValueAtTime(0.12, now);
      snareBodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      snareBody.connect(snareBodyGain);
      snareBodyGain.connect(this.getMasterGain());
      snareBody.start(now);
      snareBody.stop(now + 0.08);
    } catch (_) {
      // Audio not available
    }
  }

  // Guitar + drum fill triggered on enemy kill
  playKillFill(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const sixteenth = this.getSecondsPerBeat() * 0.25;

      // Rapid drum fill: kick-snare-kick-snare pattern
      for (let i = 0; i < 4; i++) {
        const t = now + i * sixteenth;

        if (i % 2 === 0) {
          // Kick
          const kick = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(120, t);
          kick.frequency.exponentialRampToValueAtTime(40, t + 0.08);
          kickGain.gain.setValueAtTime(0.25, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          kick.connect(kickGain);
          kickGain.connect(this.getMasterGain());
          kick.start(t);
          kick.stop(t + 0.12);
        } else {
          // Snare hit
          const bufLen = Math.floor(ctx.sampleRate * 0.06);
          const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let j = 0; j < bufLen; j++) {
            d[j] = (Math.random() * 2 - 1) * (1 - j / bufLen);
          }
          const sn = ctx.createBufferSource();
          sn.buffer = buf;
          const snGain = ctx.createGain();
          snGain.gain.setValueAtTime(0.15, t);
          snGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
          const snFilter = ctx.createBiquadFilter();
          snFilter.type = 'bandpass';
          snFilter.frequency.value = 4000;
          sn.connect(snFilter);
          snFilter.connect(snGain);
          snGain.connect(this.getMasterGain());
          sn.start(t);
          sn.stop(t + 0.06);
        }
      }

      // Ascending power chord stabs over the fill
      const fillNotes = [82.41, 110.0, 146.83, 196.0];
      for (let n = 0; n < fillNotes.length; n++) {
        const t = now + n * sixteenth;
        const noteLen = sixteenth * 0.8;

        for (const ratio of POWER_CHORD_RATIOS) {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          const dist = ctx.createWaveShaper();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(fillNotes[n] * ratio, t);

          dist.curve = this.distortionCurve;
          dist.oversample = '4x';

          oscGain.gain.setValueAtTime(0, t);
          oscGain.gain.linearRampToValueAtTime(0.05, t + 0.003);
          oscGain.gain.setValueAtTime(0.05, t + noteLen * 0.5);
          oscGain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);

          osc.connect(dist);
          dist.connect(oscGain);
          oscGain.connect(this.getMasterGain());
          osc.start(t);
          osc.stop(t + noteLen + 0.01);
        }
      }

      // Crash cymbal
      const crashLen = Math.floor(ctx.sampleRate * 0.4);
      const crashBuf = ctx.createBuffer(1, crashLen, ctx.sampleRate);
      const crashData = crashBuf.getChannelData(0);
      for (let i = 0; i < crashLen; i++) {
        crashData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crashLen, 2);
      }
      const crash = ctx.createBufferSource();
      crash.buffer = crashBuf;
      const crashGain = ctx.createGain();
      crashGain.gain.setValueAtTime(0.12, now);
      crashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      const crashFilter = ctx.createBiquadFilter();
      crashFilter.type = 'highpass';
      crashFilter.frequency.value = 6000;
      crash.connect(crashFilter);
      crashFilter.connect(crashGain);
      crashGain.connect(this.getMasterGain());
      crash.start(now);
      crash.stop(now + 0.4);
    } catch (_) {
      // Audio not available
    }
  }

  // Enemy hit - distorted palm mute
  playHit(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(82.41, now); // E2
      dist.curve = this.distortionCurve;
      dist.oversample = '4x';

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(dist);
      dist.connect(gain);
      gain.connect(this.getMasterGain());
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (_) {
      // Audio not available
    }
  }

  // Player hurt - dissonant feedback screech
  playPlayerHurt(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

      dist.curve = this.distortionCurve;
      dist.oversample = '4x';

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(dist);
      dist.connect(gain);
      gain.connect(this.getMasterGain());
      osc.start(now);
      osc.stop(now + 0.2);

      // Low feedback rumble
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(60, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      subGain.gain.setValueAtTime(0.15, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      sub.connect(subGain);
      subGain.connect(this.getMasterGain());
      sub.start(now);
      sub.stop(now + 0.15);
    } catch (_) {
      // Audio not available
    }
  }

  // Jump pad bounce - ascending harmonic
  playJumpPad(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.getMasterGain());
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (_) {
      // Audio not available
    }
  }

  // Weapon pickup - synth arpeggio
  playPickup(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const notes = [329.63, 392.0, 493.88, 659.26]; // E4, G4, B4, E5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.05;
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
        osc.connect(gain);
        gain.connect(this.getMasterGain());
        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch (_) {
      // Audio not available
    }
  }

  // Start the dynamic background music
  startMusic(): void {
    if (this.musicPlaying) return;

    try {
      const ctx = this.getContext();
      this.musicPlaying = true;

      // === Heavy synthwave bass ===
      this.bassOsc = ctx.createOscillator();
      this.bassGain = ctx.createGain();
      this.bassFilter = ctx.createBiquadFilter();

      this.bassOsc.type = 'sawtooth';
      this.bassOsc.frequency.value = this.bassNotes[0];

      this.bassFilter.type = 'lowpass';
      this.bassFilter.frequency.value = 200;
      this.bassFilter.Q.value = 5;

      this.bassGain.gain.value = 0.07;

      this.bassOsc.connect(this.bassFilter);
      this.bassFilter.connect(this.bassGain);
      this.bassGain.connect(this.getMasterGain());
      this.bassOsc.start();

      // Bass LFO for rhythmic pulsing (rate tied to BPM)
      this.bassLFO = ctx.createOscillator();
      this.bassLFOGain = ctx.createGain();
      this.bassLFO.frequency.value = this.currentBPM / 60;
      this.bassLFOGain.gain.value = 20;
      this.bassLFO.connect(this.bassLFOGain);
      this.bassLFOGain.connect(this.bassOsc.frequency);
      this.bassLFO.start();

      // === Atmospheric pad (power fifth) ===
      this.padOsc1 = ctx.createOscillator();
      this.padOsc2 = ctx.createOscillator();
      this.padGain = ctx.createGain();
      this.padFilter = ctx.createBiquadFilter();

      this.padOsc1.type = 'sine';
      this.padOsc1.frequency.value = 164.81; // E3
      this.padOsc2.type = 'sine';
      this.padOsc2.frequency.value = 246.94; // B3 (fifth)

      this.padFilter.type = 'lowpass';
      this.padFilter.frequency.value = 600;

      this.padGain.gain.value = 0.025;

      this.padOsc1.connect(this.padFilter);
      this.padOsc2.connect(this.padFilter);
      this.padFilter.connect(this.padGain);
      this.padGain.connect(this.getMasterGain());
      this.padOsc1.start();
      this.padOsc2.start();

      // Start beat scheduling
      this.scheduleBeat();
    } catch (_) {
      this.musicPlaying = false;
    }
  }

  private scheduleBeat(): void {
    if (!this.musicPlaying || !this.ctx) return;

    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // Smoothly interpolate BPM
      this.currentBPM += (this.targetBPM - this.currentBPM) * BPM_LERP_SPEED;
      const beatDuration = this.getSecondsPerBeat();

      // Update bass LFO rate to match current BPM
      if (this.bassLFO) {
        this.bassLFO.frequency.setValueAtTime(this.currentBPM / 60, now);
      }

      // Update pad filter cutoff based on tempo (more open at higher BPM)
      if (this.padFilter) {
        const cutoff = 400 + ((this.currentBPM - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 800;
        this.padFilter.frequency.setValueAtTime(cutoff, now);
      }

      // Change bass note every beat (every 2nd 8th-note tick)
      if (this.bassOsc && this.beatCount % 2 === 0) {
        const note = this.bassNotes[this.bassNoteIndex % this.bassNotes.length];
        this.bassOsc.frequency.setValueAtTime(note, now);
        this.bassNoteIndex++;
      }

      // Hi-hat on every beat (16th note feel at higher BPM)
      this.playHiHat(now);

      // Kick on beats 1 and 3 (8th-note ticks 0,4 in an 8-tick cycle)
      if (this.beatCount % 8 === 0 || this.beatCount % 8 === 4) {
        this.playBeatKick(now);
      }

      // Open hi-hat accent on beats 2 and 4 at higher tempos (ticks 2,6)
      if (this.currentBPM > 120 && (this.beatCount % 8 === 2 || this.beatCount % 8 === 6)) {
        this.playOpenHiHat(now);
      }

      this.beatCount++;

      // Schedule next beat
      const intervalMs = beatDuration * 1000 * 0.5; // 8th note resolution
      this.beatInterval = setTimeout(() => this.scheduleBeat(), intervalMs);
    } catch (_) {
      // Schedule retry
      this.beatInterval = setTimeout(() => this.scheduleBeat(), 200);
    }
  }

  private playHiHat(time: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const bufferSize = Math.floor(ctx.sampleRate * 0.02);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();
    // Hi-hat gets louder at higher tempos
    const vol = 0.03 + ((this.currentBPM - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 0.04;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getMasterGain());
    noise.start(time);
    noise.stop(time + 0.02);
  }

  private playOpenHiHat(time: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getMasterGain());
    noise.start(time);
    noise.stop(time + 0.08);
  }

  private playBeatKick(time: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(80, time);
    kick.frequency.exponentialRampToValueAtTime(30, time + 0.1);
    // Kick gets punchier at higher tempos
    const vol = 0.08 + ((this.currentBPM - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 0.08;
    kickGain.gain.setValueAtTime(vol, time);
    kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    kick.connect(kickGain);
    kickGain.connect(this.getMasterGain());
    kick.start(time);
    kick.stop(time + 0.15);
  }

  stopMusic(): void {
    this.musicPlaying = false;

    if (this.beatInterval) {
      clearTimeout(this.beatInterval);
      this.beatInterval = null;
    }

    const oscs = [this.bassOsc, this.bassLFO, this.padOsc1, this.padOsc2];
    for (const osc of oscs) {
      if (osc) {
        try { osc.stop(); } catch (_) { /* already stopped */ }
      }
    }
    this.bassOsc = null;
    this.bassLFO = null;
    this.bassLFOGain = null;
    this.bassGain = null;
    this.bassFilter = null;
    this.padOsc1 = null;
    this.padOsc2 = null;
    this.padGain = null;
    this.padFilter = null;
    this.beatCount = 0;
    this.bassNoteIndex = 0;
    this.currentBPM = MIN_BPM;
    this.targetBPM = MIN_BPM;
  }

  destroy(): void {
    this.stopMusic();
    this.masterGain = null;
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
