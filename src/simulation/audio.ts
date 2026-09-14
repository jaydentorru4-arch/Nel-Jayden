/**
 * Procedural Web Audio API sound engine for Airplane Simulator.
 * Synthesizes turbofan jet engines, piston engines, wind slipstream,
 * gear rumble, touchdown tire squeal, cockpit warnings, and radio chatter.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine sound nodes
  private engineGain: GainNode | null = null;
  private engineNoiseNode: AudioNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineOscGain: GainNode | null = null;

  // Slipstream wind noise
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Cockpit background avionics hum
  private avionicsGain: GainNode | null = null;

  // State
  private lastSpoolN1: number = 0;
  private lastSpokeCalloutTime: number = 0;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSynth();
      this.setupWindSynth();
      this.setupAvionicsSynth();
    } catch {
      console.warn('Web Audio API not supported or blocked by user gesture.');
    }
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.masterGain) return;

    // Pink/Brown noise generator for turbofan jet roar
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.08;
      b2 = 0.85 * b2 + white * 0.12;
      output[i] = (b0 + b1 + b2) * 0.3;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(200, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    whiteNoiseSource.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    whiteNoiseSource.start(0);
    this.engineNoiseNode = whiteNoiseSource;

    // Turbine blade whistling tones (N1 harmonic buzz)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(80, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(160, this.ctx.currentTime);

    const oscFilter = this.ctx.createBiquadFilter();
    oscFilter.type = 'bandpass';
    oscFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    oscFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.engineOscGain = this.ctx.createGain();
    this.engineOscGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineOsc1.connect(oscFilter);
    this.engineOsc2.connect(oscFilter);
    oscFilter.connect(this.engineOscGain);
    this.engineOscGain.connect(this.masterGain);

    this.engineOsc1.start(0);
    this.engineOsc2.start(0);
  }

  private setupWindSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const windNoiseSource = this.ctx.createBufferSource();
    windNoiseSource.buffer = noiseBuffer;
    windNoiseSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    windNoiseSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windNoiseSource.start(0);
  }

  private setupAvionicsSynth() {
    if (!this.ctx || !this.masterGain) return;

    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(400, this.ctx.currentTime); // 400 Hz aircraft AC avionics frequency!

    this.avionicsGain = this.ctx.createGain();
    this.avionicsGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    humOsc.connect(this.avionicsGain);
    this.avionicsGain.connect(this.masterGain);
    humOsc.start(0);
  }

  public updateEngineSound(n1Percent: number, airspeedKts: number, reverse: boolean, avionicsOn: boolean) {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      // AudioContext starts suspended until user gesture
      return;
    }

    const t = this.ctx.currentTime;
    this.lastSpoolN1 = n1Percent;

    // Avionics 400Hz hum
    if (this.avionicsGain) {
      const avTarget = avionicsOn ? 0.04 : 0.0001;
      this.avionicsGain.gain.setTargetAtTime(avTarget, t, 0.5);
    }

    // Engine volume and pitch
    if (this.engineGain && this.engineFilter && this.engineOscGain && this.engineOsc1 && this.engineOsc2) {
      if (n1Percent > 2) {
        const norm = Math.min(1.0, n1Percent / 100);
        const engineVol = 0.05 + norm * 0.45 + (reverse ? 0.25 : 0);
        this.engineGain.gain.setTargetAtTime(engineVol, t, 0.15);

        // Lowpass cutoff expands as turbine spools up
        const cutoff = 200 + norm * 1800 + (reverse ? 600 : 0);
        this.engineFilter.frequency.setTargetAtTime(cutoff, t, 0.15);

        // Whistle tones
        const baseFreq = 70 + norm * 260 + (reverse ? 100 : 0);
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.1);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.15, t, 0.1);
        this.engineOscGain.gain.setTargetAtTime(norm * 0.08, t, 0.2);
      } else {
        this.engineGain.gain.setTargetAtTime(0.0001, t, 0.3);
        this.engineOscGain.gain.setTargetAtTime(0.0001, t, 0.3);
      }
    }

    // Wind noise based on airspeed
    if (this.windGain && this.windFilter) {
      const windNorm = Math.min(1.0, airspeedKts / 350);
      const windVol = Math.pow(windNorm, 1.8) * 0.35;
      this.windGain.gain.setTargetAtTime(windVol, t, 0.2);
      this.windFilter.frequency.setTargetAtTime(300 + windNorm * 1200, t, 0.2);
    }
  }

  public playTouchdownSqueal(verticalSpeedFpm: number) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Chirp oscillator for tire contact friction
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.15);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.26);

    // Deep thump for landing gear strut compression
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    const thumpIntensity = Math.min(1.0, Math.abs(verticalSpeedFpm) / 600);
    thumpOsc.type = 'triangle';
    thumpOsc.frequency.setValueAtTime(90, t);
    thumpOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    thumpGain.gain.setValueAtTime(0.5 * thumpIntensity, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.masterGain!);
    thumpOsc.start(t);
    thumpOsc.stop(t + 0.46);
  }

  public playClick() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.04);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playChime(type: 'CAUTION' | 'WARNING' | 'ALTITUDE' | 'SEATBELT' | 'GEAR') {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    if (type === 'SEATBELT' || type === 'ALTITUDE' || type === 'GEAR') {
      // Classic high-low double ding
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.frequency.setValueAtTime(type === 'GEAR' ? 440 : 800, t);
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc1.connect(gain1);
      gain1.connect(this.masterGain!);
      osc1.start(t);
      osc1.stop(t + 0.45);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.frequency.setValueAtTime(type === 'GEAR' ? 330 : 600, t + 0.18);
      gain2.gain.setValueAtTime(0.2, t + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc2.connect(gain2);
      gain2.connect(this.masterGain!);
      osc2.start(t + 0.18);
      osc2.stop(t + 0.7);
    } else if (type === 'WARNING') {
      // Autopilot disconnect "cavalry charge" triple pulse
      for (let i = 0; i < 3; i++) {
        const delay = i * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(1046.5, t + delay); // C6
        gain.gain.setValueAtTime(0.25, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.08);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + delay);
        osc.stop(t + delay + 0.09);
      }
    }
  }

  public playCrashSound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Deep explosion bass rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 1.2);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 1.5);
  }

  public stopAll() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public playRadioSquawk() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    // Aviation mic squawk click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public speakCallout(phrase: string) {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastSpokeCalloutTime < 1100) return; // Prevent overlapping speech
    this.lastSpokeCalloutTime = now;

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        utterance.volume = 0.85;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback or ignore
      }
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
