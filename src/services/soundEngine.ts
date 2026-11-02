/**
 * Authentic Procedural Sound Engine
 * Synthesizes high-fidelity audio using the Web Audio API without relying on external URLs:
 * - Continuous atmospheric rain & droplets
 * - Distant rumbling thunder
 * - Paper crumpling crunch
 * - Vintage lighter open, flint strike, and ignition whoosh
 * - Roaring, crackling fire with popping embers and dynamic intensity
 * - Ash dispersal breath
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Rain nodes
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainInterval: number | null = null;

  // Fire nodes
  private fireMasterGain: GainNode | null = null;
  private fireRoarSource: AudioBufferSourceNode | null = null;
  private fireCracklingActive: boolean = false;
  private fireCrackleTimer: number | null = null;

  constructor() {
    // Lazy initialized on first user interaction
  }

  public async init(): Promise<void> {
    if (this.isInitialized && this.ctx && this.ctx.state === 'running') {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or pending user interaction:', e);
    }
  }

  public getInitialized(): boolean {
    return this.isInitialized && this.ctx?.state === 'running';
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 1;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous realistic rain
   */
  public startRain(volume: number = 0.45): void {
    if (!this.ctx || !this.masterGain) return;

    if (this.rainSource) {
      // Already running, adjust volume
      if (this.rainGain) {
        this.rainGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.5);
      }
      return;
    }

    // 5 seconds looping brown/pink noise buffer
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0;
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      // Pink noise filter approximation
      b0L = 0.99886 * b0L + whiteL * 0.0555179;
      b1L = 0.99332 * b1L + whiteL * 0.0750759;
      b2L = 0.96900 * b2L + whiteL * 0.1538520;
      b3L = 0.86650 * b3L + whiteL * 0.3104856;
      b4L = 0.55000 * b4L + whiteL * 0.5329522;
      b5L = -0.7616 * b5L - whiteL * 0.0168980;
      left[i] = (b0L + b1L + b2L + b3L + b4L + b5L + whiteL * 0.5362) * 0.08;

      b0R = 0.99886 * b0R + whiteR * 0.0555179;
      b1R = 0.99332 * b1R + whiteR * 0.0750759;
      b2R = 0.96900 * b2R + whiteR * 0.1538520;
      b3R = 0.86650 * b3R + whiteR * 0.3104856;
      b4R = 0.55000 * b4R + whiteR * 0.5329522;
      b5R = -0.7616 * b5R - whiteR * 0.0168980;
      right[i] = (b0R + b1R + b2R + b3R + b4R + b5R + whiteR * 0.5362) * 0.08;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    // Filters to shape the rain sound
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 1.2);

    this.rainSource.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.rainSource.start(0);

    // Occasional individual raindrops hitting surfaces
    this.rainInterval = window.setInterval(() => {
      if (!this.isMuted && Math.random() < 0.6) {
        this.playRaindrop();
      }
    }, 180);
  }

  private playRaindrop(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = 1200 + Math.random() * 1800;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.06);

    const dropVol = 0.015 + Math.random() * 0.03;
    gain.gain.setValueAtTime(dropVol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  public stopRain(): void {
    if (this.rainInterval) {
      clearInterval(this.rainInterval);
      this.rainInterval = null;
    }
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8);
      setTimeout(() => {
        if (this.rainSource) {
          try {
            this.rainSource.stop();
            this.rainSource.disconnect();
          } catch {
            // ignore
          }
          this.rainSource = null;
        }
      }, 1000);
    }
  }

  /**
   * Distant low rumbling thunder
   */
  public playThunder(intensity: number = 0.8): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const thunderGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 4.0);

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, now);
    osc1.frequency.linearRampToValueAtTime(36, now + 3.5);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(68, now);
    osc2.frequency.linearRampToValueAtTime(40, now + 3.8);

    // Rumble envelope
    thunderGain.gain.setValueAtTime(0.001, now);
    thunderGain.gain.exponentialRampToValueAtTime(0.35 * intensity, now + 0.3);
    thunderGain.gain.exponentialRampToValueAtTime(0.25 * intensity, now + 1.2);
    thunderGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(thunderGain);
    thunderGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 4.6);
    osc2.stop(now + 4.6);
  }

  /**
   * Authentic paper crumple sound
   */
  public playCrumple(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    // Series of 4 crisp crunch impulses across 1.2 seconds
    const crunchCount = 4;
    for (let c = 0; c < crunchCount; c++) {
      const delay = c * 0.22 + Math.random() * 0.08;
      const now = this.ctx.currentTime + delay;

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Crunchy fibrous noise
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        const env = Math.pow(1 - t, 2.5);
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.4 ? 1 : 0.2) * env;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400 + Math.random() * 1200, now);
      bandpass.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
    }
  }

  /**
   * Vintage lighter lid opening: metallic ping and hinge flick
   */
  public playLighterOpen(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Metallic ring (Zippo ping)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4100, now);
    osc.frequency.exponentialRampToValueAtTime(3950, now + 0.35);

    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    // Hinge click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(900, now);
    clickGain.gain.setValueAtTime(0.25, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);

    osc.start(now);
    clickOsc.start(now);
    osc.stop(now + 0.36);
    clickOsc.stop(now + 0.05);
  }

  /**
   * Lighter flint strike & flame ignition
   */
  public playLighterIgnite(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Friction rasp of flint wheel (harsh short burst)
    const raspSize = Math.floor(this.ctx.sampleRate * 0.07);
    const raspBuffer = this.ctx.createBuffer(1, raspSize, this.ctx.sampleRate);
    const raspData = raspBuffer.getChannelData(0);
    for (let i = 0; i < raspSize; i++) {
      raspData[i] = (Math.random() * 2 - 1) * Math.sin((i / raspSize) * Math.PI);
    }
    const raspSource = this.ctx.createBufferSource();
    raspSource.buffer = raspBuffer;

    const raspFilter = this.ctx.createBiquadFilter();
    raspFilter.type = 'highpass';
    raspFilter.frequency.setValueAtTime(2600, now);

    const raspGain = this.ctx.createGain();
    raspGain.gain.setValueAtTime(0.3, now);
    raspGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    raspSource.connect(raspFilter);
    raspFilter.connect(raspGain);
    raspGain.connect(this.masterGain);
    raspSource.start(now);

    // 2. Gas ignition puff / flame whoosh
    const whooshDelay = 0.05;
    const whooshNow = now + whooshDelay;
    const whooshSize = Math.floor(this.ctx.sampleRate * 0.35);
    const whooshBuffer = this.ctx.createBuffer(1, whooshSize, this.ctx.sampleRate);
    const whooshData = whooshBuffer.getChannelData(0);
    for (let i = 0; i < whooshSize; i++) {
      whooshData[i] = Math.random() * 2 - 1;
    }
    const whooshSource = this.ctx.createBufferSource();
    whooshSource.buffer = whooshBuffer;

    const whooshFilter = this.ctx.createBiquadFilter();
    whooshFilter.type = 'lowpass';
    whooshFilter.frequency.setValueAtTime(700, whooshNow);
    whooshFilter.frequency.exponentialRampToValueAtTime(280, whooshNow + 0.32);

    const whooshGain = this.ctx.createGain();
    whooshGain.gain.setValueAtTime(0.001, whooshNow);
    whooshGain.gain.exponentialRampToValueAtTime(0.38, whooshNow + 0.05);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, whooshNow + 0.34);

    whooshSource.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(this.masterGain);
    whooshSource.start(whooshNow);
  }

  /**
   * Start authentic roaring fire and snapping crackles
   */
  public startFire(initialIntensity: number = 0.4): void {
    if (!this.ctx || !this.masterGain) return;

    if (this.fireRoarSource) return;

    // Master fire gain
    this.fireMasterGain = this.ctx.createGain();
    this.fireMasterGain.gain.setValueAtTime(initialIntensity, this.ctx.currentTime);
    this.fireMasterGain.connect(this.masterGain);

    // Continuous brown noise combustion roar
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.025 * white) / 1.025;
      data[i] = last * 3.5;
    }

    this.fireRoarSource = this.ctx.createBufferSource();
    this.fireRoarSource.buffer = buffer;
    this.fireRoarSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(420, this.ctx.currentTime);

    this.fireRoarSource.connect(lowpass);
    lowpass.connect(this.fireMasterGain);
    this.fireRoarSource.start(0);

    // Start crackle / pop generator loop
    this.fireCracklingActive = true;
    this.scheduleNextCrackle();
  }

  private scheduleNextCrackle(): void {
    if (!this.fireCracklingActive || !this.ctx) return;

    // Random interval between pops (30ms - 130ms)
    const delay = 30 + Math.random() * 100;
    this.fireCrackleTimer = window.setTimeout(() => {
      this.playCracklePop();
      this.scheduleNextCrackle();
    }, delay);
  }

  private playCracklePop(): void {
    if (!this.ctx || !this.fireMasterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const isLoudPop = Math.random() < 0.22;
    const duration = isLoudPop ? 0.035 : 0.015;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500 + Math.random() * 2400, now);
    filter.Q.setValueAtTime(6.0, now);

    const gain = this.ctx.createGain();
    const popVol = isLoudPop ? 0.35 + Math.random() * 0.25 : 0.12 + Math.random() * 0.15;
    gain.gain.setValueAtTime(popVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.fireMasterGain);

    source.start(now);
  }

  /**
   * Dynamically ramp up fire intensity as the fire expands to the entire screen
   */
  public setFireIntensity(level: number, duration: number = 0.5): void {
    if (!this.ctx || !this.fireMasterGain) return;
    this.fireMasterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.fireMasterGain.gain.setTargetAtTime(level, this.ctx.currentTime, duration);
  }

  /**
   * Stop fire audio with smooth fade out
   */
  public stopFire(fadeTime: number = 1.0): void {
    this.fireCracklingActive = false;
    if (this.fireCrackleTimer) {
      clearTimeout(this.fireCrackleTimer);
      this.fireCrackleTimer = null;
    }

    if (this.fireMasterGain && this.ctx) {
      this.fireMasterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.fireMasterGain.gain.setTargetAtTime(0, this.ctx.currentTime, fadeTime * 0.5);

      setTimeout(() => {
        if (this.fireRoarSource) {
          try {
            this.fireRoarSource.stop();
            this.fireRoarSource.disconnect();
          } catch {
            // ignore
          }
          this.fireRoarSource = null;
        }
        if (this.fireMasterGain) {
          this.fireMasterGain.disconnect();
          this.fireMasterGain = null;
        }
      }, fadeTime * 1000 + 200);
    }
  }

  /**
   * Soft ash dispersal whisper / whoosh
   */
  public playAshBreath(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const dur = 1.8;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const env = Math.sin(progress * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.15;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
  }
}

export const sound = new SoundEngine();
